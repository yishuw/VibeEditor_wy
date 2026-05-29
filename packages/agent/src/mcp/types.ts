import type { ToolInputSchema } from '../types/tool';

/** MCP 服务端返回的单个工具定义 */
export interface MCPToolDefinition {
  name: string;
  description?: string;
  inputSchema: ToolInputSchema;
}

/** MCP 工具调用结果 */
export interface MCPCallResult {
  content: { type: 'text' | 'image' | 'resource'; text?: string; data?: string; mimeType?: string }[];
  isError?: boolean;
}

/** MCP 传输层抽象 —— 封装与 MCP Server 的 JSON-RPC 通信 */
export interface IMCPTransport {
  /** 发送 JSON-RPC 请求，返回 result */
  sendRequest(method: string, params?: Record<string, unknown>): Promise<unknown>;
  /** 发送 JSON-RPC 通知（无响应） */
  sendNotification(method: string, params?: Record<string, unknown>): void;
  /** 释放传输资源 */
  dispose(): void;
}

/** 构建 XML 标签用法示例字符串，如 <tool_name param1="..." [param2="..."]/> */
export function buildXMLUsage(name: string, schema: ToolInputSchema): string {
  const parts: string[] = [];
  const required = new Set(schema.required || []);

  if (schema.properties) {
    for (const [key, prop] of Object.entries(schema.properties)) {
      if (required.has(key)) {
        parts.push(`${key}="${prop.type === 'string' ? '...' : '...'}"`);
      } else {
        parts.push(`[${key}="${prop.type === 'string' ? '...' : '...'}"]`);
      }
    }
  }

  return `<${name}${parts.length ? ' ' + parts.join(' ') : ''}/>`;
}
