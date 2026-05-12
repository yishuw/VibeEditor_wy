import { IFileSystem, FileEntry, WriteFileOptions } from './types';

interface VirtualNode {
  name: string;
  isDirectory: boolean;
  content?: string;
  children: Map<string, VirtualNode>;
  size?: number;
  modifiedAt: number;
}

export class VirtualFileSystem implements IFileSystem {
  readonly type = 'virtual' as const;
  readonly cwd: string;
  private root: VirtualNode;

  constructor(rootName = '/') {
    this.cwd = rootName;
    this.root = { name: rootName, isDirectory: true, children: new Map(), modifiedAt: Date.now() };
  }

  private resolve(path: string): { node: VirtualNode; parent: VirtualNode | null; name: string } | null {
    const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
    if (parts.length === 0) return { node: this.root, parent: null, name: this.root.name };
    let current = this.root;
    for (let i = 0; i < parts.length - 1; i++) {
      const child = current.children.get(parts[i]);
      if (!child || !child.isDirectory) return null;
      current = child;
    }
    const name = parts[parts.length - 1];
    const node = current.children.get(name);
    if (!node) return { node: current, parent: current, name };
    return { node, parent: current, name };
  }

  async readFile(filePath: string): Promise<string> {
    const res = this.resolve(filePath);
    if (!res || res.node.isDirectory) throw new Error(`File not found: ${filePath}`);
    return res.node.content || '';
  }

  async writeFile(filePath: string, content: string, _options?: WriteFileOptions): Promise<void> {
    const parts = filePath.replace(/\\/g, '/').split('/').filter(Boolean);
    if (parts.length === 0) throw new Error('Empty path');
    let current = this.root;
    for (let i = 0; i < parts.length - 1; i++) {
      let child = current.children.get(parts[i]);
      if (!child) {
        child = { name: parts[i], isDirectory: true, children: new Map(), modifiedAt: Date.now() };
        current.children.set(parts[i], child);
      }
      current = child;
    }
    const name = parts[parts.length - 1];
    const existing = current.children.get(name);
    const node: VirtualNode = {
      name,
      isDirectory: false,
      content,
      children: new Map(),
      size: Buffer.byteLength(content, 'utf-8'),
      modifiedAt: Date.now(),
    };
    if (existing && existing.isDirectory) throw new Error(`Cannot write file over directory: ${filePath}`);
    current.children.set(name, node);
  }

  async deleteFile(filePath: string): Promise<void> {
    const parts = filePath.replace(/\\/g, '/').split('/').filter(Boolean);
    if (parts.length === 0) throw new Error('Empty path');
    let current = this.root;
    for (let i = 0; i < parts.length - 1; i++) {
      const child = current.children.get(parts[i]);
      if (!child) throw new Error(`Path not found: ${filePath}`);
      current = child;
    }
    const name = parts[parts.length - 1];
    const node = current.children.get(name);
    if (!node || node.isDirectory) throw new Error(`Not a file: ${filePath}`);
    current.children.delete(name);
  }

  async readDir(dirPath: string): Promise<FileEntry[]> {
    const res = this.resolve(dirPath);
    if (!res || !res.node.isDirectory) throw new Error(`Directory not found: ${dirPath}`);
    const node = dirPath === '/' || dirPath === '' ? this.root : res.node;
    const entries: FileEntry[] = [];
    for (const [, child] of node.children) {
      entries.push({
        name: child.name,
        path: dirPath ? `${dirPath.replace(/\\/g, '/')}/${child.name}` : child.name,
        isDirectory: child.isDirectory,
        size: child.size,
        modifiedAt: child.modifiedAt,
      });
    }
    return entries.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  async createDir(dirPath: string): Promise<void> {
    const parts = dirPath.replace(/\\/g, '/').split('/').filter(Boolean);
    let current = this.root;
    for (const part of parts) {
      let child = current.children.get(part);
      if (!child) {
        child = { name: part, isDirectory: true, children: new Map(), modifiedAt: Date.now() };
        current.children.set(part, child);
      }
      current = child;
    }
  }

  async deleteDir(dirPath: string, _recursive = true): Promise<void> {
    const res = this.resolve(dirPath);
    if (!res || !res.node.isDirectory) throw new Error(`Directory not found: ${dirPath}`);
    if (res.parent) {
      res.parent.children.delete(res.name);
    }
  }

  async exists(filePath: string): Promise<boolean> {
    const res = this.resolve(filePath);
    return res !== null && res.node !== this.root;
  }

  async stat(filePath: string): Promise<FileEntry> {
    const res = this.resolve(filePath);
    if (!res) throw new Error(`Path not found: ${filePath}`);
    const node = res.node;
    return {
      name: node.name,
      path: filePath,
      isDirectory: node.isDirectory,
      size: node.size,
      modifiedAt: node.modifiedAt,
    };
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    const oldRes = this.resolve(oldPath);
    if (!oldRes || !oldRes.parent) throw new Error(`Source not found: ${oldPath}`);
    const content = await this.readFile(oldPath);
    await this.writeFile(newPath, content);
    await this.deleteFile(oldPath);
  }

  dispose(): void {
    this.root.children.clear();
  }
}
