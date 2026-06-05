import { Router, Request, Response } from 'express';
import { AgentRuntime, type AgentRuntimeConfig, type AgentRuntimeEvent, type AgentContext, type AgentEditResult } from '@vibeeditor/agent';
import { LocalFileSystem } from '@vibeeditor/core';
import { executeEdits } from '@vibeeditor/agent';
import { loadEnabledMcpServers } from './mcp';
import type { WorkspaceManager } from '../workspace/manager';
import type { LLMGateway } from '../llm/gateway';

function buildRuntimeConfig(body: Record<string, unknown>, configDir: string, llmGateway: LLMGateway, workspaceRoot?: string): AgentRuntimeConfig {
  const cfg = (body.config as any) || body;
  const mode = (cfg.mode || 'plan') as 'build' | 'plan';
  const activeProvider = llmGateway.getActiveProvider();
  return {
    mode,
    provider: {
      apiUrl: activeProvider?.apiUrl || '',
      apiKey: activeProvider?.apiKey || '',
      model: activeProvider?.model || '',
    },
    systemPrompt: cfg.systemPrompt,
    temperature: cfg.temperature,
    maxTokens: cfg.maxTokens,
    workspaceRoot: workspaceRoot || process.cwd(),
    mcpServers: mode === 'build' ? loadEnabledMcpServers(configDir) : undefined,
  };
}

interface StreamRequestBody {
  message: string;
  context?: AgentContext;
  workspaceRoot?: string;
  workspaceId?: string;
  config?: Record<string, unknown>;
}

export function createAgentRouter(configDir: string, workspaceManager: WorkspaceManager, llmGateway: LLMGateway) {
  const router = Router();

  function getRuntime(reqBody: Record<string, unknown>, workspaceRootOverride?: string): AgentRuntime {
    const body = reqBody as unknown as StreamRequestBody;
    const wsRoot = workspaceRootOverride || body.workspaceRoot;
    if (body.workspaceId) {
      const ws = workspaceManager.getWorkspaceData(body.workspaceId);
      if (ws) {
        return new AgentRuntime(buildRuntimeConfig(reqBody, configDir, llmGateway, ws.rootPath));
      }
    }
    return new AgentRuntime(
      buildRuntimeConfig(reqBody, configDir, llmGateway, wsRoot)
    );
  }

  router.post('/chat', async (req: Request, res: Response) => {
    try {
      const { message, context, workspaceId } = req.body;
      if (!message) {
        res.status(400).json({ error: 'message is required' });
        return;
      }

      const runtime = getRuntime(req.body);
      const result = await runtime.chat(message, context as AgentContext);

      res.json({
        id: `agent_${Date.now()}`,
        role: 'assistant',
        content: result.content,
        timestamp: Date.now(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  router.post('/stream', async (req: Request, res: Response) => {
    const body = req.body as StreamRequestBody;
    const { message, context, workspaceRoot, workspaceId } = body;
    if (!message) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const writeSSE = (data: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const runtime = getRuntime(req.body, workspaceRoot);

    try {
      const mcpStatus = runtime.mcpStatus;
      if (mcpStatus.serverCount > 0) {
        await runtime.initialize();
        writeSSE({ tool_start: `🔌 MCP: ${mcpStatus.serverCount} server(s), ${mcpStatus.toolCount} tool(s)` });
      }

      const result = await runtime.chatStream(message, context as AgentContext, (e: AgentRuntimeEvent) => {
        switch (e.type) {
          case 'chunk':
            writeSSE({ chunk: e.text });
            break;
          case 'thinking':
            writeSSE({ thinking: e.text });
            break;
          case 'tool_start':
            writeSSE({ tool_start: `🔍 ${e.toolName}: ${e.toolLabel || ''}` });
            break;
          case 'tool_end':
            writeSSE({ tool_end: `${e.toolName} complete` });
            break;
          case 'done':
            break;
          case 'error':
            writeSSE({ error: e.error });
            break;
        }
      });
      writeSSE({ done: true, edits: result.edits, toolCalls: result.toolCalls.length });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      writeSSE({ error: msg });
      writeSSE({ done: true });
    } finally {
      try { await runtime.dispose(); } catch { /* ignore */ }
    }
  });

  router.post('/apply-edits', async (req: Request, res: Response) => {
    try {
      const { rootPath, edits } = req.body;

      if (!rootPath || !edits) {
        res.status(400).json({ error: 'rootPath and edits are required' });
        return;
      }

      if (!Array.isArray(edits) || edits.length === 0) {
        res.status(400).json({ error: 'edits must be a non-empty array' });
        return;
      }

      const fs = new LocalFileSystem(rootPath);
      const result = await executeEdits(fs, edits as AgentEditResult[]);

      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  return router;
}
