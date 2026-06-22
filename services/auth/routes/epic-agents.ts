import { Router, Request, Response } from 'express';
import { AgentRunState } from '../agent-state';
import { AgentSupervisor } from '../agent-supervisor';

export function createAgentsRouter(authMiddleware: any, checkRole: any): Router {
  const router = Router();

  const AGENT_ROLES = [
    'super_admin', 'admin', 'cabinet_avocat',
    'avocat', 'avocat_associe', 'juriste',
  ];

  router.post('/run', authMiddleware, checkRole(AGENT_ROLES), async (req: Request, res: Response): Promise<void> => {
    const { instruction } = req.body as { instruction?: string };

    const trimmed = (instruction ?? '').trim();
    if (!trimmed) {
      res.status(400).json({ error: 'instruction required' });
      return;
    }
    if (trimmed.length > 2000) {
      res.status(400).json({ error: 'instruction too long' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (data: object) => {
      if (res.writableEnded) return;
      res.write('data: ' + JSON.stringify(data) + '\n\n');
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error('Agent timeout after 60 s')), 60_000);

    const state = new AgentRunState();
    state.on('event', send);

    req.on('close', () => {
      clearTimeout(timeoutId);
      state.removeAllListeners();
      controller.abort();
    });

    try {
      const supervisor = new AgentSupervisor();
      await supervisor.run(trimmed, state, controller.signal);
      send({ type: 'done' });
    } catch (err) {
      const msg = (err as Error).message;
      send({ type: 'error', agentId: 'supervisor', message: controller.signal.aborted ? 'Request cancelled' : msg });
    } finally {
      clearTimeout(timeoutId);
      res.end();
    }
  });

  return router;
}
