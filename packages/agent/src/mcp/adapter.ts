import type { ITool, ToolExecutionContext, ToolInputSchema } from '../types/tool';
import type { MCPToolDefinition, MCPCallResult } from './types';

/**
 * MCP 工具适配器 —— 将 MCP 服务端工具包装为 ITool。
 * 通过回调委托 execute 到 MCP 客户端的 callTool。
 */
export class MCPToolAdapter implements ITool {
  readonly name: string;
  readonly description: string;
  readonly usage: string;
  readonly inputSchema: ToolInputSchema;

  private callHandler: (name: string, args: Record<string, unknown>) => Promise<MCPCallResult>;

  constructor(
    definition: MCPToolDefinition,
    usage: string,
    callHandler: (name: string, args: Record<string, unknown>) => Promise<MCPCallResult>
  ) {
    this.name = definition.name;
    this.description = definition.description || definition.name;
    this.usage = usage;
    this.inputSchema = definition.inputSchema;
    this.callHandler = callHandler;
  }

  async execute(params: Record<string, string>, _context: ToolExecutionContext): Promise<string> {
    try {
      const args = this.coerceParams(params);
      const result = await this.callHandler(this.name, args);

      if (result.isError) {
        const errText = result.content.map(c => c.text || '').join('\n');
        return `MCP tool error (${this.name}): ${errText}`;
      }

      return result.content
        .filter(c => c.type === 'text' && c.text)
        .map(c => c.text!)
        .join('\n');
    } catch (e: any) {
      return `MCP tool error (${this.name}): ${e.message}`;
    }
  }

  /** 将 XML 属性字符串参数按 inputSchema 转换为预期类型 */
  private coerceParams(params: Record<string, string>): Record<string, unknown> {
    const result: Record<string, unknown> = { ...params };

    if (this.inputSchema.properties) {
      for (const [key, prop] of Object.entries(this.inputSchema.properties)) {
        const raw = params[key];
        if (raw === undefined) continue;

        switch (prop.type) {
          case 'number':
          case 'integer':
            result[key] = Number(raw);
            break;
          case 'boolean':
            result[key] = raw === 'true';
            break;
          case 'array':
          case 'object':
            try { result[key] = JSON.parse(raw); } catch { /* keep as string */ }
            break;
          default:
            break;
        }
      }
    }

    return result;
  }
}
