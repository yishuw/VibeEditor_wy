import { IFileSystem, FileEntry, FileContent, WriteFileOptions } from './types';

export interface ServerFileSystemOptions {
  baseUrl: string;
  token?: string;
  fetchFn?: typeof fetch;
}

export class ServerFileSystem implements IFileSystem {
  readonly type = 'server' as const;
  readonly cwd: string;
  private baseUrl: string;
  private token?: string;
  private fetchFn: typeof fetch;

  constructor(rootPath: string, options: ServerFileSystemOptions) {
    this.cwd = rootPath;
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.token = options.token;
    this.fetchFn = options.fetchFn || (typeof fetch !== 'undefined' ? fetch : (() => { throw new Error('fetch not available'); }) as unknown as typeof fetch);
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  }

  private api(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await this.fetchFn(this.api(endpoint), {
      ...options,
      headers: { ...this.headers(), ...options?.headers },
    });
    if (!res.ok) throw new Error(`Server API error: ${res.status} ${res.statusText}`);
    return res.json() as Promise<T>;
  }

  async readFile(filePath: string): Promise<string> {
    const data = await this.request<FileContent>(`/api/files/read?path=${encodeURIComponent(filePath)}`);
    return data.content;
  }

  async writeFile(filePath: string, content: string, _options?: WriteFileOptions): Promise<void> {
    await this.request('/api/files/write', {
      method: 'POST',
      body: JSON.stringify({ path: filePath, content }),
    });
  }

  async deleteFile(filePath: string): Promise<void> {
    await this.request(`/api/files/delete?path=${encodeURIComponent(filePath)}`, { method: 'DELETE' });
  }

  async readDir(dirPath: string): Promise<FileEntry[]> {
    return this.request<FileEntry[]>(`/api/files/list?path=${encodeURIComponent(dirPath)}`);
  }

  async createDir(dirPath: string): Promise<void> {
    await this.request('/api/files/mkdir', {
      method: 'POST',
      body: JSON.stringify({ path: dirPath }),
    });
  }

  async deleteDir(dirPath: string, recursive = true): Promise<void> {
    await this.request(`/api/files/rmdir?path=${encodeURIComponent(dirPath)}&recursive=${recursive}`, { method: 'DELETE' });
  }

  async exists(filePath: string): Promise<boolean> {
    const res = await this.request<{ exists: boolean }>(`/api/files/exists?path=${encodeURIComponent(filePath)}`);
    return res.exists;
  }

  async stat(filePath: string): Promise<FileEntry> {
    return this.request<FileEntry>(`/api/files/stat?path=${encodeURIComponent(filePath)}`);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    await this.request('/api/files/rename', {
      method: 'POST',
      body: JSON.stringify({ oldPath, newPath }),
    });
  }

  dispose(): void {}
}
