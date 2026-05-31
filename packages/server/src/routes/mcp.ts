import { Router, Request, Response } from 'express';
import { McpManager, type McpServerConfig, type McpConfig } from '@vibeeditor/agent';

const router = Router();

router.post('/test', async (req: Request, res: Response) => {
  const { config } = req.body as { config?: McpServerConfig };

  if (!config || !config.type) {
    res.status(400).json({ success: false, error: 'config is required and must include a type' });
    return;
  }

  const validTypes = ['stdio', 'sse', 'http'];
  if (!validTypes.includes(config.type)) {
    res.status(400).json({ success: false, error: `Invalid type "${config.type}". Must be one of: ${validTypes.join(', ')}` });
    return;
  }

  const manager = new McpManager();
  try {
    const mcpConfig: McpConfig = {
      mcpServers: { __test__: config },
    };
    await manager.connectAll(mcpConfig);
    const tools = await manager.collectTools();
    const serverName = config.name || '__test__';
    res.json({ success: true, serverName, serverType: config.type, tools });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.json({ success: false, error: message });
  } finally {
    try {
      await manager.disconnectAll();
    } catch { /* 断开连接阶段的错误忽略 */ }
  }
});

export { router as mcpRouter };
