import type { IMCPTransport } from '../types';

/** 检测命令是否为 Python/uv（需要 PYTHONUNBUFFERED 来避免管道输出缓冲） */
function isPythonCommand(command: string, args: string[]): boolean {
  const cmd = command.toLowerCase().replace(/\.exe$/, '');
  // 直接 Python
  if (['python', 'python3', 'python3.11', 'python3.12', 'python3.13'].includes(cmd)) return true;
  // uv / uvx
  if (['uv', 'uvx'].includes(cmd)) return true;
  // uv run python / uvx python 等间接形式
  if (args.length > 0) {
    const firstArg = args[0].toLowerCase().replace(/\.exe$/, '');
    if (cmd === 'uv' && (firstArg === 'run' || firstArg === 'tool')) return true;
    if (['python', 'python3'].includes(firstArg)) return true;
  }
  return false;
}

/**
 * MCP stdio 传输 —— 通过子进程 stdin/stdout 进行 JSON-RPC 通信。
 * 支持 node / python / uv 等可执行文件。自动为 Python 进程设置 PYTHONUNBUFFERED。
 */
export class StdioTransport implements IMCPTransport {
  private childProcess: import('child_process').ChildProcess | null = null;
  private requestId = 0;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private buffer = '';
  private onStderr?: (data: string) => void;

  constructor(
    private command: string,
    private args: string[] = [],
    private options: { cwd?: string; env?: Record<string, string>; onStderr?: (data: string) => void } = {}
  ) {
    this.onStderr = options.onStderr;
  }

  async connect(): Promise<void> {
    const { spawn } = await import('child_process');

    return new Promise((resolve, reject) => {
      // Python 管道输出默认缓冲，自动设置 PYTHONUNBUFFERED（用户显式 env 优先）
      const baseEnv = { ...process.env };
      if (isPythonCommand(this.command, this.args)) {
        baseEnv.PYTHONUNBUFFERED = '1';
      }
      const mergedEnv = { ...baseEnv, ...this.options.env };

      this.childProcess = spawn(this.command, this.args, {
        cwd: this.options.cwd,
        env: mergedEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      if (this.onStderr && this.childProcess.stderr) {
        this.childProcess.stderr.on('data', (chunk: Buffer) => this.onStderr!(chunk.toString()));
      }

      if (this.childProcess.stdout) {
        this.childProcess.stdout.on('data', (chunk: Buffer) => {
          this.buffer += chunk.toString();
          this.processBuffer();
        });
      }

      this.childProcess.on('error', reject);
      this.childProcess.on('exit', code => {
        if (code !== 0 && code !== null) {
          for (const [, pending] of this.pending) {
            pending.reject(new Error(`MCP process exited with code ${code}`));
          }
          this.pending.clear();
        }
      });

      // 等待一小段时间让进程启动
      setTimeout(resolve, 200);
    });
  }

  sendRequest(method: string, params?: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.pending.set(id, { resolve, reject });

      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params: params || {},
      };

      this.send(JSON.stringify(request));

      // 超时处理
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`MCP request timeout: ${method}`));
        }
      }, 30000);
    });
  }

  sendNotification(method: string, params?: Record<string, unknown>): void {
    const notification = {
      jsonrpc: '2.0',
      method,
      params: params || {},
    };
    this.send(JSON.stringify(notification));
  }

  dispose(): void {
    if (this.childProcess) {
      this.childProcess.kill();
      this.childProcess = null;
    }
    this.pending.clear();
    this.buffer = '';
  }

  private send(data: string): void {
    if (!this.childProcess?.stdin) throw new Error('MCP process not connected');
    this.childProcess.stdin.write(data + '\n');
  }

  private processBuffer(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const message = JSON.parse(trimmed);
        if (message.id && this.pending.has(message.id)) {
          const { resolve, reject } = this.pending.get(message.id)!;
          this.pending.delete(message.id);

          if (message.error) {
            reject(new Error(`MCP error ${message.error.code}: ${message.error.message}`));
          } else {
            resolve(message.result);
          }
        }
      } catch {
        // 跳过无法解析的行
      }
    }
  }
}
