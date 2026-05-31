import { ref, watch } from 'vue';
import type { McpServerConfig, McpToolInfo } from '@vibeeditor/agent';
import type { McpServerUI } from '../types/mcp-ui';

const STORAGE_KEY = 'vibeeditor-mcp-servers';

function loadServers(): McpServerUI[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* 忽略损坏的数据 */ }
  return [];
}

function saveServers(servers: McpServerUI[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(servers));
}

function createMcpSettings() {
  const servers = ref<McpServerUI[]>(loadServers());

  watch(servers, (val) => saveServers(val), { deep: true });

  let idCounter = 0;

  function addServer(config: McpServerConfig, name: string, description: string, tools: McpToolInfo[]): McpServerUI {
    const id = `mcp_${Date.now()}_${++idCounter}`;
    const server: McpServerUI = {
      id,
      name: name || config.name || id,
      description: description || undefined,
      config: { ...config, name: name || config.name },
      enabled: true,
      toolCount: tools.length,
      tools,
    };
    servers.value.push(server);
    return server;
  }

  function updateServer(id: string, config: McpServerConfig, name: string, description: string, tools: McpToolInfo[]): void {
    const idx = servers.value.findIndex(s => s.id === id);
    if (idx === -1) return;
    servers.value[idx] = {
      ...servers.value[idx],
      name: name || config.name || id,
      description: description || undefined,
      config: { ...config, name: name || config.name },
      toolCount: tools.length,
      tools,
    };
  }

  function removeServer(id: string): void {
    const idx = servers.value.findIndex(s => s.id === id);
    if (idx === -1) return;
    servers.value.splice(idx, 1);
  }

  function toggleServer(id: string): void {
    const server = servers.value.find(s => s.id === id);
    if (server) {
      server.enabled = !server.enabled;
    }
  }

  function setTools(id: string, tools: McpToolInfo[]): void {
    const server = servers.value.find(s => s.id === id);
    if (server) {
      server.tools = tools;
      server.toolCount = tools.length;
    }
  }

  return { servers, addServer, updateServer, removeServer, toggleServer, setTools };
}

let instance: ReturnType<typeof createMcpSettings> | null = null;

export function useMcpSettings() {
  if (!instance) {
    instance = createMcpSettings();
  }
  return instance;
}
