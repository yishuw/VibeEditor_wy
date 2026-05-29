import type { IMCPTransport } from '../types';

/**
 * MCP SSE 传输 —— 通过 HTTP POST 发送请求，SSE 流接收响应。
 * 适用于需要服务端推送或长连接的工具调用。浏览器和 Node.js 均可用。
 */
export class SSETransport implements IMCPTransport {
  private endpoint: string;
  private headers: Record<string, string>;
  private requestId = 0;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private abortController: AbortController | null = null;
  private sessionId: string | null = null;

  constructor(
    endpoint: string,
    options?: { headers?: Record<string, string> }
  ) {
    this.endpoint = endpoint;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      ...options?.headers,
    };
  }

  async sendRequest(method: string, params?: Record<string, unknown>): Promise<unknown> {
    const id = ++this.requestId;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });

      const reqHeaders: Record<string, string> = { ...this.headers };
      if (this.sessionId) {
        reqHeaders['Mcp-Session-Id'] = this.sessionId;
      }

      fetch(this.endpoint, {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id,
          method,
          params: params || {},
        }),
        signal: this.abortController?.signal,
      }).then(async response => {
        // 提取 session ID
        const sid = response.headers.get('Mcp-Session-Id');
        if (sid) this.sessionId = sid;

        const contentType = response.headers.get('Content-Type') || '';

        if (contentType.includes('text/event-stream')) {
          // SSE 流式响应 —— 从流中读取事件
          await this.readSSEStream(response, id);
        } else {
          // JSON 直接响应
          const data = await response.json() as any;
          this.resolvePending(id, data);
        }
      }).catch(err => {
        if (this.pending.has(id)) {
          const { reject: rej } = this.pending.get(id)!;
          this.pending.delete(id);
          rej(err);
        }
      });

      // 超时
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`MCP SSE request timeout: ${method}`));
        }
      }, 60000);
    });
  }

  sendNotification(method: string, params?: Record<string, unknown>): void {
    const reqHeaders: Record<string, string> = { ...this.headers };
    if (this.sessionId) {
      reqHeaders['Mcp-Session-Id'] = this.sessionId;
    }

    fetch(this.endpoint, {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params: params || {},
      }),
      signal: this.abortController?.signal,
    }).catch(() => { /* fire-and-forget */ });
  }

  dispose(): void {
    this.abortController?.abort();
    this.abortController = null;
    this.pending.clear();
    this.sessionId = null;
  }

  private resolvePending(id: number, message: { id?: number; result?: unknown; error?: { code: number; message: string } }): void {
    if (message.id != null && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id)!;
      this.pending.delete(message.id);

      if (message.error) {
        reject(new Error(`MCP error ${message.error.code}: ${message.error.message}`));
      } else {
        resolve(message.result);
      }
    }
  }

  private async readSSEStream(response: Response, requestId: number): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      // 退回直接 JSON
      const data = await response.json() as any;
      this.resolvePending(requestId, data);
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = '';
    let currentData = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const rawLine of lines) {
          const line = rawLine.trimEnd();

          if (line === '') {
            // 空行 = 事件边界
            if (currentData) {
              try {
                const message = JSON.parse(currentData);
                this.resolvePending(requestId, message);
              } catch { /* skip */ }
            }
            currentEvent = '';
            currentData = '';
            continue;
          }

          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim();
            currentData += currentData ? '\n' + dataStr : dataStr;
          }
        }
      }

      // 最后残留的数据
      if (currentData) {
        try {
          const message = JSON.parse(currentData);
          this.resolvePending(requestId, message);
        } catch { /* skip */ }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
