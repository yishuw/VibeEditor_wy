export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modifiedAt?: number;
  children?: FileEntry[];
}

export interface FileContent {
  path: string;
  content: string;
  encoding?: string;
}

export interface WriteFileOptions {
  encoding?: string;
  createIfNotExists?: boolean;
}

export interface IFileSystem {
  readonly type: 'local' | 'server' | 'virtual';
  readonly cwd: string;

  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string, options?: WriteFileOptions): Promise<void>;
  deleteFile(path: string): Promise<void>;
  readDir(path: string): Promise<FileEntry[]>;
  createDir(path: string): Promise<void>;
  deleteDir(path: string, recursive?: boolean): Promise<void>;
  exists(path: string): Promise<boolean>;
  stat(path: string): Promise<FileEntry>;
  rename(oldPath: string, newPath: string): Promise<void>;
  watch?(path: string, callback: (event: FileChangeEvent) => void): FileWatcher;
  dispose(): void;
}

export type FileChangeType = 'create' | 'change' | 'delete';

export interface FileChangeEvent {
  type: FileChangeType;
  path: string;
}

export interface FileWatcher {
  close(): void;
}
