import { Router, Request, Response } from 'express';

const router = Router();

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, context, config } = req.body;

    res.json({
      id: `agent_${Date.now()}`,
      role: 'assistant',
      content: `[Agent mode: ${config?.mode || 'chat'}] Agent is ready. Received: "${message?.slice(0, 100)}"`,
      timestamp: Date.now(),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/stream', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { message, context, config } = req.body;

  const words = `[${config?.mode || 'chat'}] Processing: "${message?.slice(0, 50) || ''}"...\nAgent response will appear here once the AI backend is connected.`.split(' ');

  for (const word of words) {
    res.write(`data: ${JSON.stringify({ chunk: word + ' ' })}\n\n`);
    await new Promise(r => setTimeout(r, 30));
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export { router as agentRouter };
