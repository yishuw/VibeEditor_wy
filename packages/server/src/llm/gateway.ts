import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';

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
      const stat = require('fs').statSync(p);
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
      this.cacheMtime = require('fs').statSync(p).mtimeMs;
    } catch { /* ignore */ }
    this.cache = settings;
  }

  listProviders(): LLMProvider[] {
    const settings = this.load();
    return settings.providers.map(p => ({
      ...p,
      apiKey: this.maskApiKey(p.apiKey),
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

  addProvider(provider: Omit<LLMProvider, 'id'>): LLMProvider {
    const settings = this.load();
    const id = `provider_${Date.now()}_${settings.providers.length}`;
    const entry: LLMProvider = { id, ...provider, enabled: provider.enabled !== false };
    settings.providers.push(entry);
    if (!settings.activeProviderId) settings.activeProviderId = id;
    this.save(settings);
    return entry;
  }

  updateProvider(id: string, updates: Partial<Omit<LLMProvider, 'id'>>): LLMProvider | null {
    const settings = this.load();
    const idx = settings.providers.findIndex(p => p.id === id);
    if (idx === -1) return null;
    settings.providers[idx] = { ...settings.providers[idx], ...updates };
    this.save(settings);
    return settings.providers[idx];
  }

  deleteProvider(id: string): boolean {
    const settings = this.load();
    const idx = settings.providers.findIndex(p => p.id === id);
    if (idx === -1) return false;
    settings.providers.splice(idx, 1);
    if (settings.activeProviderId === id) {
      settings.activeProviderId = settings.providers[0]?.id || '';
    }
    this.save(settings);
    return true;
  }

  setActiveProvider(id: string): boolean {
    const settings = this.load();
    const exists = settings.providers.find(p => p.id === id);
    if (!exists) return false;
    settings.activeProviderId = id;
    this.save(settings);
    return true;
  }

  private maskApiKey(key: string): string {
    if (!key || key.length <= 8) return key;
    return key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4);
  }
}
