import { EventEmitter } from 'events';

export type AgentStatusValue = 'pending' | 'running' | 'done' | 'error';

export interface AgentStatus {
  agentId: string;
  type: string;
  status: AgentStatusValue;
  result?: string;
  error?: string;
}

export interface AgentEvent {
  type: string;
  [key: string]: unknown;
}

export class AgentRunState extends EventEmitter {
  private agents = new Map<string, AgentStatus>();

  register(agentId: string, type: string): void {
    this.agents.set(agentId, { agentId, type, status: 'pending' });
  }

  start(agentId: string): void {
    const entry = this.agents.get(agentId);
    if (entry) entry.status = 'running';
    this.emit('event', { type: 'worker:start', agentId });
  }

  complete(agentId: string, result: string): void {
    const entry = this.agents.get(agentId);
    if (entry) { entry.status = 'done'; entry.result = result; }
    this.emit('event', { type: 'worker:result', agentId, result });
  }

  fail(agentId: string, error: string): void {
    const entry = this.agents.get(agentId);
    if (entry) { entry.status = 'error'; entry.error = error; }
    this.emit('event', { type: 'error', agentId, message: error });
  }

  emitRaw(event: AgentEvent): void {
    this.emit('event', event);
  }

  getResults(): { agentId: string; result: string }[] {
    return Array.from(this.agents.values())
      .filter((a) => a.status === 'done' && a.result)
      .map((a) => ({ agentId: a.agentId, result: a.result! }));
  }
}
