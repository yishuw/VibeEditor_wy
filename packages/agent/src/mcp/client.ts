import type { ITool } from '../types/tool';
import type { IMCPTransport, MCPToolDefinition, MCPCallResult } from './types';
import { buildXMLUsage } from './types';
import { MCPToolAdapter } from './adapter';

/** MCP 客户端 —— 管理连接生命周期、发现工具、创建适配器 */
export class MCPClient {
  private transport: IMCPTransport;
  private initialized = false;
  private tools: MCPToolDefinition[] = [];

  constructor(transport: IMCPTransport) {
    this.transport = transport;
  }

  /** 握手并初始化，完成后可供调用 */
  async initialize(clientName = 'VibeEditor', clientVersion = '0.1.0'): Promise<void> {
    const result = await this.transport.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      clientInfo: { name: clientName, version: clientVersion },
    }) as Record<string, unknown>;

    if (!result) throw new Error('MCP initialize failed: no response');

    this.transport.sendNotification('initialized', {});
    this.initialized = true;
  }

  /** 获取服务端工具列表 */
  async listTools(): Promise<MCPToolDefinition[]> {
    this.ensureInitialized();
    const result = await this.transport.sendRequest('tools/list') as { tools?: MCPToolDefinition[] };

    this.tools = result.tools || [];
    return this.tools;
  }

  /** 调用指定工具 */
  async callTool(name: string, args: Record<string, unknown>): Promise<MCPCallResult> {
    this.ensureInitialized();
    const result = await this.transport.sendRequest('tools/call', { name, arguments: args }) as MCPCallResult;

    return result;
  }

  /** 将已发现的所有工具包装为 ITool 适配器数组 */
  createToolAdapters(): ITool[] {
    return this.tools.map(def =>
      new MCPToolAdapter(def, buildXMLUsage(def.name, def.inputSchema), (name, args) => this.callTool(name, args))
    );
  }

  /** 一次调用：发现工具并返回 ITool[]，可直接注册到 Agent */
  async discoverAndCreateAdapters(): Promise<ITool[]> {
    await this.listTools();
    return this.createToolAdapters();
  }

  /** 获取原始工具定义列表 */
  getToolDefinitions(): MCPToolDefinition[] {
    return this.tools;
  }

  dispose(): void {
    this.initialized = false;
    this.tools = [];
    this.transport.dispose();
  }

  private ensureInitialized(): void {
    if (!this.initialized) throw new Error('MCP client not initialized');
  }
}
