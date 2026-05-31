import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { filesRouter } from './routes/files';
import { agentRouter } from './routes/agent';
import { mcpRouter } from './routes/mcp';

export interface ServerConfig {
  port?: number;
  host?: string;
  corsOrigin?: string;
  serveStatic?: string;
}

export function createApp(config: ServerConfig = {}) {
  const app = express();
  const port = config.port ?? 3456;
  const host = config.host ?? '0.0.0.0';

  app.use(cors({ origin: config.corsOrigin ?? '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
  app.use(express.json({ limit: '50mb' }));

  app.use('/api/files', filesRouter);
  app.use('/api/agent', agentRouter);
  app.use('/api/mcp', mcpRouter);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  if (config.serveStatic) {
    app.use(express.static(config.serveStatic));
    app.get('*', (_req, res) => {
      res.sendFile('index.html', { root: config.serveStatic });
    });
  }

  return { app, port, host };
}

export function startServer(config: ServerConfig = {}) {
  const { app, port, host } = createApp(config);
  const server = createServer(app);

  server.listen(port, host, () => {
    console.log(`VibeEditor server running at http://${host}:${port}`);
  });

  return server;
}

if (require.main === module || process.argv[1]?.endsWith('index.ts')) {
  startServer({
    serveStatic: process.env.SERVE_STATIC,
    port: Number(process.env.PORT) || 3456,
  });
}
