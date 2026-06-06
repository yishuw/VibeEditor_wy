import { i18n } from '../locales';

declare const __SERVER_PORT__: number;

const DEFAULT_BASE_URL: string = typeof __SERVER_PORT__ !== 'undefined'
  ? `http://localhost:${__SERVER_PORT__}`
  : '';

export interface LLMProviderInfo {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
}

export interface TestConnectionResult {
  success: boolean;
  models?: string[];
  error?: string;
}

function api(baseUrl: string, path: string, options?: RequestInit) {
  return fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
}

export function createLLMService(baseUrl = DEFAULT_BASE_URL) {
  return {
    async listProviders(): Promise<{ providers: LLMProviderInfo[]; activeProviderId: string }> {
      const res = await api(baseUrl, '/api/llm/providers');
      if (!res.ok) throw new Error(`${i18n.global.t('errors.apiError')}: ${res.status}`);
      return res.json();
    },

    async addProvider(params: {
      name?: string;
      apiUrl: string;
      apiKey?: string;
      model?: string;
      enabled?: boolean;
    }): Promise<LLMProviderInfo> {
      const res = await api(baseUrl, '/api/llm/providers', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`${i18n.global.t('errors.apiError')} ${res.status}: ${err}`);
      }
      return res.json();
    },

    async updateProvider(id: string, params: Partial<{
      name: string;
      apiUrl: string;
      apiKey: string;
      model: string;
      enabled: boolean;
    }>): Promise<LLMProviderInfo> {
      const res = await api(baseUrl, `/api/llm/providers/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`${i18n.global.t('errors.apiError')} ${res.status}: ${err}`);
      }
      return res.json();
    },

    async deleteProvider(id: string): Promise<void> {
      const res = await api(baseUrl, `/api/llm/providers/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`${i18n.global.t('errors.apiError')} ${res.status}: ${err}`);
      }
    },

    async setActiveProvider(id: string): Promise<void> {
      const res = await api(baseUrl, `/api/llm/providers/${encodeURIComponent(id)}/set-active`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`${i18n.global.t('errors.apiError')} ${res.status}: ${err}`);
      }
    },

    async testProvider(id: string): Promise<TestConnectionResult> {
      try {
        const res = await api(baseUrl, `/api/llm/providers/${encodeURIComponent(id)}/test`, {
          method: 'POST',
        });
        if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
        return res.json();
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  };
}

const service = createLLMService();

export function getLLMService() {
  return service;
}
