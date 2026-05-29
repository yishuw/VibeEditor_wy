import type { IMCPTransport } from '../types';

/**
 * MCP HTTP 传输 —— 通过 HTTP POST 进行 JSON-RPC 通信。
 * 每次请求独立，无持久连接。浏览器和 Node.js 均可用。
 */
export class HTTPTransport implements IMCPTransport {
  private requestId = 0;
  private headers: Record<string, string>;

  constructor(
    private endpoint: string,
    options?: { headers?: Record<string, string> }
  ) {
    this.headers = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };
  }

  async sendRequest(method: string, params?: Record<string, unknown>): Promise<unknown> {
    const id = ++this.requestId;

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id,
        method,
        params: params || {},
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`MCP HTTP error ${response.status}: ${text}`);
    }

    const data = await response.json() as any;

    if (data.error) {
      throw new Error(`MCP error ${data.error.code}: ${data.error.message}`);
    }

    return data.result;
  }

  sendNotification(method: string, params?: Record<string, unknown>): void {
    fetch(this.endpoint, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params: params || {},
      }),
    }).catch(() => { /* fire-and-forget */ });
  }

  dispose(): void {
    // HTTP 无状态，无需清理
  }
}
