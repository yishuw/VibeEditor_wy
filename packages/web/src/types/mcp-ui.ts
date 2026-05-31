import type { McpServerConfig, McpToolInfo } from '@vibeeditor/agent';

/** MCP 服务器 UI 层表示，在 agent 类型基础上扩展前端专属字段 */
export interface McpServerUI {
  /** 唯一标识符，用于 v-for key 和增删改操作 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 可选描述 */
  description?: string;
  /** MCP 服务器配置（stdio / sse / http），直接复用 agent 的联合类型 */
  config: McpServerConfig;
  /** 是否启用 */
  enabled: boolean;
  /** 缓存的工具数量 */
  toolCount: number;
  /** 上次成功连接测试时缓存的工具列表 */
  tools?: McpToolInfo[];
}
