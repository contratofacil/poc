const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface AuthState {
  token: string | null;
  email: string | null;
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message ?? 'Login failed');
  return data.token;
}

export async function generateText(token: string, instruction: string, docType: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/documents/generate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ instruction, doc_type: docType }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message ?? 'Generation failed');
  return data.document.content;
}

export async function correctText(token: string, text: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/documents/generate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instruction: `Corrigez et améliorez ce texte juridique en respectant le droit portugais. Conservez le sens exact, améliorez la précision juridique et la formulation :\n\n${text}`,
      doc_type: 'correction',
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message ?? 'Correction failed');
  return data.document.content;
}

export async function adaptStyle(token: string, text: string, styleRef: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/documents/generate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instruction: `Adaptez le texte suivant au style de référence indiqué. Style cible: "${styleRef}"\n\nTexte à adapter:\n${text}`,
      doc_type: 'adaptation_style',
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message ?? 'Style adaptation failed');
  return data.document.content;
}
