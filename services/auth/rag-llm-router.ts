import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { Mistral } from '@mistralai/mistralai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Response } from 'express';
import { get } from './db';

export type LLMProvider = 'anthropic' | 'openai' | 'mistral' | 'google';

export interface PromptConfig {
  id: string;
  key: string;
  name: string;
  system_prompt: string;
  user_prompt_template: string | null;
  provider: LLMProvider;
  model: string;
  max_tokens: number;
  temperature: number;
}

// Per-provider model lists exposed to admin UI
export const PROVIDER_MODELS: Record<LLMProvider, string[]> = {
  anthropic: ['claude-haiku-4-5', 'claude-sonnet-4-6', 'claude-opus-4-8'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
  mistral: ['mistral-small-latest', 'mistral-large-latest', 'open-mistral-nemo'],
  google: ['gemini-2.0-flash', 'gemini-1.5-pro'],
};

// Cache prompt configs for 60 seconds
const promptCache = new Map<string, { config: PromptConfig; ts: number }>();
const CACHE_TTL_MS = 60_000;

export async function getPromptConfig(key: string): Promise<PromptConfig> {
  const cached = promptCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.config;

  const row = await get<PromptConfig>(
    'SELECT id, key, name, system_prompt, user_prompt_template, provider, model, max_tokens, temperature FROM llm_prompts WHERE key = ?',
    [key],
  );
  if (!row) throw new Error(`LLM prompt not found: '${key}'`);

  promptCache.set(key, { config: row, ts: Date.now() });
  return row;
}

export function invalidatePromptCache(key?: string): void {
  if (key) promptCache.delete(key);
  else promptCache.clear();
}

export function resolveTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => variables[k] ?? '');
}

// ── Lazy provider clients ────────────────────────────────────────────────────

let _anthropic: Anthropic | null = null;
let _openai: OpenAI | null = null;
let _mistral: Mistral | null = null;
let _google: GoogleGenerativeAI | null = null;

function getAnthropic(): Anthropic {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("Provider 'anthropic' not configured: ANTHROPIC_API_KEY missing");
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) throw new Error("Provider 'openai' not configured: OPENAI_API_KEY missing");
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

function getMistral(): Mistral {
  if (!_mistral) {
    if (!process.env.MISTRAL_API_KEY) throw new Error("Provider 'mistral' not configured: MISTRAL_API_KEY missing");
    _mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
  }
  return _mistral;
}

function getGoogle(): GoogleGenerativeAI {
  if (!_google) {
    if (!process.env.GOOGLE_AI_API_KEY) throw new Error("Provider 'google' not configured: GOOGLE_AI_API_KEY missing");
    _google = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  }
  return _google;
}

// ── Raw call (dynamic prompts, no DB lookup) ─────────────────────────────────

export async function callLLMRaw(
  systemPrompt: string,
  userContent: string,
  provider: LLMProvider = 'anthropic',
  model = 'claude-haiku-4-5',
  maxTokens = 2048,
  signal?: AbortSignal,
): Promise<string> {
  switch (provider) {
    case 'anthropic': {
      const msg = await getAnthropic().messages.create(
        {
          model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: userContent }],
        },
        { signal },
      );
      return (msg.content[0] as Anthropic.TextBlock).text;
    }
    case 'openai': {
      const res = await getOpenAI().chat.completions.create(
        {
          model,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
        },
        { signal },
      );
      return res.choices[0].message.content ?? '';
    }
    case 'mistral': {
      const res = await getMistral().chat.complete(
        {
          model,
          maxTokens,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
        },
        { signal },
      );
      const choice = res.choices?.[0];
      const content = choice?.message?.content;
      return typeof content === 'string' ? content : '';
    }
    case 'google': {
      const genModel = getGoogle().getGenerativeModel({ model });
      const chat = genModel.startChat({
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: maxTokens },
      });
      const result = await chat.sendMessage(userContent, { signal });
      return result.response.text();
    }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// ── Non-streaming call ───────────────────────────────────────────────────────

export async function callPrompt(key: string, variables: Record<string, string>): Promise<string> {
  const config = await getPromptConfig(key);
  const userContent = config.user_prompt_template
    ? resolveTemplate(config.user_prompt_template, variables)
    : variables['message'] ?? '';

  switch (config.provider) {
    case 'anthropic': {
      const msg = await getAnthropic().messages.create({
        model: config.model,
        max_tokens: config.max_tokens,
        system: config.system_prompt,
        messages: [{ role: 'user', content: userContent }],
      });
      return (msg.content[0] as Anthropic.TextBlock).text;
    }
    case 'openai': {
      const res = await getOpenAI().chat.completions.create({
        model: config.model,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        messages: [
          { role: 'system', content: config.system_prompt },
          { role: 'user', content: userContent },
        ],
      });
      return res.choices[0].message.content ?? '';
    }
    case 'mistral': {
      const res = await getMistral().chat.complete({
        model: config.model,
        maxTokens: config.max_tokens,
        temperature: config.temperature,
        messages: [
          { role: 'system', content: config.system_prompt },
          { role: 'user', content: userContent },
        ],
      });
      const choice = res.choices?.[0];
      const content = choice?.message?.content;
      return typeof content === 'string' ? content : '';
    }
    case 'google': {
      const genModel = getGoogle().getGenerativeModel({ model: config.model });
      const chat = genModel.startChat({
        systemInstruction: config.system_prompt,
        generationConfig: { maxOutputTokens: config.max_tokens, temperature: config.temperature },
      });
      const result = await chat.sendMessage(userContent);
      return result.response.text();
    }
    default:
      throw new Error(`Unknown provider: ${(config as PromptConfig).provider}`);
  }
}

// ── SSE streaming call ───────────────────────────────────────────────────────

export async function streamPrompt(
  key: string,
  variables: Record<string, string>,
  res: Response,
  onToken?: (t: string) => void,
): Promise<string> {
  const config = await getPromptConfig(key);
  const userContent = config.user_prompt_template
    ? resolveTemplate(config.user_prompt_template, variables)
    : variables['message'] ?? '';

  let fullText = '';

  const emit = (token: string) => {
    fullText += token;
    if (onToken) onToken(token);
    res.write('data: ' + JSON.stringify({ type: 'text', content: token }) + '\n\n');
  };

  switch (config.provider) {
    case 'anthropic': {
      const stream = await getAnthropic().messages.stream({
        model: config.model,
        max_tokens: config.max_tokens,
        system: config.system_prompt,
        messages: [{ role: 'user', content: userContent }],
      });
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          emit(event.delta.text);
        }
      }
      break;
    }
    case 'openai': {
      const stream = await getOpenAI().chat.completions.create({
        model: config.model,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        messages: [
          { role: 'system', content: config.system_prompt },
          { role: 'user', content: userContent },
        ],
        stream: true,
      });
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) emit(delta);
      }
      break;
    }
    case 'mistral': {
      const stream = await getMistral().chat.stream({
        model: config.model,
        maxTokens: config.max_tokens,
        temperature: config.temperature,
        messages: [
          { role: 'system', content: config.system_prompt },
          { role: 'user', content: userContent },
        ],
      });
      for await (const chunk of stream) {
        const delta = chunk.data.choices[0]?.delta?.content;
        if (delta && typeof delta === 'string') emit(delta);
      }
      break;
    }
    case 'google': {
      const genModel = getGoogle().getGenerativeModel({ model: config.model });
      const chat = genModel.startChat({
        systemInstruction: config.system_prompt,
        generationConfig: { maxOutputTokens: config.max_tokens, temperature: config.temperature },
      });
      const result = await chat.sendMessageStream(userContent);
      for await (const chunk of result.stream) {
        const delta = chunk.text();
        if (delta) emit(delta);
      }
      break;
    }
    default:
      throw new Error(`Unknown provider: ${(config as PromptConfig).provider}`);
  }

  return fullText;
}
