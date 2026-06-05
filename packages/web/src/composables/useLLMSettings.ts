import { ref } from 'vue';
import { getLLMService, type LLMProviderInfo } from '../services/llmService';

export interface ProviderConfig {
  id: string;
  name: string;
  apiUrl: string;
  model: string;
}

export interface ProviderPreset {
  id: string;
  name: string;
  apiUrl: string;
  defaultModel: string;
  models: string[];
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/v1',
    defaultModel: '',
    models: [],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1',
    defaultModel: '',
    models: [],
  },
  {
    id: 'siliconflow',
    name: '硅基流动 (SiliconFlow)',
    apiUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: '',
    models: [],
  },
];

function createLLMSettings() {
  const providers = ref<LLMProviderInfo[]>([]);
  const activeId = ref<string>('');
  const activeProvider = ref<ProviderConfig | null>(null);
  const loaded = ref(false);

  let initialized = false;

  async function init() {
    if (initialized) return;
    initialized = true;
    providers.value = [];
    try {
      const data = await getLLMService().listProviders();
      providers.value = data.providers;
      activeId.value = data.activeProviderId || data.providers[0]?.id || '';
    } catch {
      /* 保持空列表 */
    }
    updateActive();
    loaded.value = true;
  }

  function updateActive() {
    const found = providers.value.find(p => p.id === activeId.value && p.enabled);
    if (!found) {
      const first = providers.value.find(p => p.enabled);
      activeProvider.value = first
        ? { id: first.id, name: first.name, apiUrl: first.apiUrl, model: first.model }
        : null;
    } else {
      activeProvider.value = {
        id: found.id, name: found.name, apiUrl: found.apiUrl, model: found.model,
      };
    }
  }

  async function addProvider(config: Omit<ProviderConfig, 'id'>) {
    const entry = await getLLMService().addProvider(config);
    providers.value.push(entry);
    if (!activeId.value) {
      activeId.value = entry.id;
      activeProvider.value = { id: entry.id, name: entry.name, apiUrl: entry.apiUrl, model: entry.model };
    }
    return entry;
  }

  async function updateProvider(id: string, updates: Partial<Omit<ProviderConfig, 'id'>>) {
    await getLLMService().updateProvider(id, updates);
    const idx = providers.value.findIndex(p => p.id === id);
    if (idx !== -1) providers.value[idx] = { ...providers.value[idx], ...updates };
    if (id === activeId.value) updateActive();
  }

  async function removeProvider(id: string) {
    await getLLMService().deleteProvider(id);
    providers.value = providers.value.filter(p => p.id !== id);
    if (activeId.value === id) {
      activeId.value = providers.value[0]?.id || '';
      updateActive();
    }
  }

  async function setActive(id: string) {
    await getLLMService().setActiveProvider(id);
    activeId.value = id;
    updateActive();
  }

  function testProvider(id: string) {
    return getLLMService().testProvider(id);
  }

  function reload() {
    initialized = false;
    return init();
  }

  init();

  return {
    loaded,
    providers,
    activeId,
    activeProvider,
    addProvider,
    updateProvider,
    removeProvider,
    setActive,
    testProvider,
    reload,
  };
}

let instance: ReturnType<typeof createLLMSettings> | null = null;

export function useLLMSettings() {
  if (!instance) {
    instance = createLLMSettings();
  }
  return instance;
}
