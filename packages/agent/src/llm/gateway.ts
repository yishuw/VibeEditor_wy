import { existsSync, readFileSync, writeFileSync, statSync } from 'fs';
import * as path from 'path';
import { createLogger } from '../logger';
import { LOG_CATEGORY } from '../log-categories';

const log = createLogger(LOG_CATEGORY.GATEWAY);

export interface LLMProvider {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
}

export interface LLMSettings {
  providers: LLMProvider[];
  activeProviderId: string;
}

export function maskApiKey(key: string): string {
  if (!key || key.length <= 8) return key;
  return key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4);
}

function settingsPath(configDir: string): string {
  return path.join(configDir, 'llm-settings.json');
}

export class LLMGateway {
  private configDir: string;
  private cache: LLMSettings | null = null;
  private cacheMtime = 0;

  constructor(configDir: string) {
    this.configDir = configDir;
  }

  private load(): LLMSettings {
    const p = settingsPath(this.configDir);
    try {
      const stat = statSync(p);
      if (this.cache && stat.mtimeMs === this.cacheMtime) return this.cache;
      this.cacheMtime = stat.mtimeMs;
    } catch {
      this.cache = { providers: [], activeProviderId: '' };
      return this.cache;
    }

    try {
      const raw = JSON.parse(readFileSync(p, 'utf-8'));
      const providers: LLMProvider[] = (raw.providers || []).map((p: any, i: number) => ({
        id: p.id || `provider_${i}`,
        name: p.name || 'Unnamed',
        apiUrl: p.apiUrl || '',
        apiKey: p.apiKey || '',
        model: p.model || '',
        enabled: p.enabled !== false,
      }));
      this.cache = {
        providers,
        activeProviderId: raw.activeProviderId || '',
      };
    } catch {
      this.cache = { providers: [], activeProviderId: '' };
    }
    return this.cache;
  }

  private save(settings: LLMSettings): void {
    const p = settingsPath(this.configDir);
    writeFileSync(p, JSON.stringify(settings, null, 2), 'utf-8');
    try {
      this.cacheMtime = statSync(p).mtimeMs;
    } catch { /* ignore */ }
    this.cache = settings;
  }

  listProviders(): LLMProvider[] {
    const settings = this.load();
    return settings.providers.map(p => ({
      ...p,
      apiKey: maskApiKey(p.apiKey),
    }));
  }

  getActiveProvider(): LLMProvider | null {
    const settings = this.load();
    const active = settings.providers.find(p => p.id === settings.activeProviderId);
    if (active && active.enabled) return active;
    const first = settings.providers.find(p => p.enabled);
    if (first) return first;
    return null;
  }

  getProvider(id: string): LLMProvider | null {
    const settings = this.load();
    return settings.providers.find(p => p.id === id) || null;
  }

  addProvider(provider: Omit<LLMProvider, 'id'>): LLMProvider {
    const settings = this.load();
    const id = `provider_${Date.now()}_${settings.providers.length}`;
    const entry: LLMProvider = { id, ...provider, enabled: provider.enabled !== false };
    settings.providers.push(entry);
    if (!settings.activeProviderId) settings.activeProviderId = id;
    this.save(settings);
    log.info(`Provider added: id=${id}, name="${entry.name}", model=${entry.model}`);
    return entry;
  }

  updateProvider(id: string, updates: Partial<Omit<LLMProvider, 'id'>>): LLMProvider | null {
    const settings = this.load();
    const idx = settings.providers.findIndex(p => p.id === id);
    if (idx === -1) return null;
    settings.providers[idx] = { ...settings.providers[idx], ...updates };
    this.save(settings);
    log.info(`Provider updated: id=${id}, name="${settings.providers[idx].name}"`);
    return settings.providers[idx];
  }

  deleteProvider(id: string): boolean {
    const settings = this.load();
    const idx = settings.providers.findIndex(p => p.id === id);
    if (idx === -1) return false;
    const name = settings.providers[idx].name;
    settings.providers.splice(idx, 1);
    if (settings.activeProviderId === id) {
      settings.activeProviderId = settings.providers[0]?.id || '';
    }
    this.save(settings);
    log.info(`Provider deleted: id=${id}, name="${name}"`);
    return true;
  }

  setActiveProvider(id: string): boolean {
    const settings = this.load();
    const exists = settings.providers.find(p => p.id === id);
    if (!exists) return false;
    settings.activeProviderId = id;
    this.save(settings);
    log.info(`Active provider set: id=${id}, name="${exists.name}"`);
    return true;
  }
}
