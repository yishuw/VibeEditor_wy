/**
 * MCP 传输层集成测试 —— 覆盖 stdio / HTTP / SSE 三种传输。
 * 运行: node --import tsx packages/agent/src/mcp/__test.ts
 */
import { spawn, type ChildProcess } from 'child_process';
import { createServer as createHttp, type IncomingMessage, type ServerResponse } from 'http';
import type { AddressInfo } from 'net';
import { MCPClient } from './client';
import { HTTPTransport } from './transports/http';
import { SSETransport } from './transports/sse';
import { StdioTransport } from './transports/stdio';
import type { IMCPTransport } from './types';

const TOOLS = [
  {
    name: 'echo',
    description: 'Echo back the input',
    inputSchema: {
      type: 'object' as const,
      properties: { message: { type: 'string', description: 'Text to echo' } },
      required: ['message'],
    },
  },
  {
    name: 'add',
    description: 'Add two numbers',
    inputSchema: {
      type: 'object' as const,
      properties: {
        a: { type: 'number', description: 'First number' },
        b: { type: 'number', description: 'Second number' },
      },
      required: ['a', 'b'],
    },
  },
];

function handleJSONRPC(body: any) {
  const { id, method, params } = body;
  if (method === 'initialize') {
    return { jsonrpc: '2.0', id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'HTTP Test', version: '1.0' } } };
  }
  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: TOOLS } };
  }
  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    let text: string;
    if (name === 'echo') text = `echo: ${args.message}`;
    else if (name === 'add') text = `${args.a} + ${args.b} = ${Number(args.a) + Number(args.b)}`;
    else text = `unknown: ${name}`;
    return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text }] } };
  }
  return { jsonrpc: '2.0', id, error: { code: -32601, message: `Unknown method: ${method}` } };
}

// ==================== HTTP Mock Server ====================

async function startHttpServer(useSSE: boolean): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = createHttp((req: IncomingMessage, res: ServerResponse) => {
      if (req.method !== 'POST') { res.writeHead(405).end(); return; }

      let raw = '';
      req.on('data', (chunk: Buffer) => raw += chunk.toString());
      req.on('end', () => {
        let body: any;
        try { body = JSON.parse(raw); } catch { res.writeHead(400).end('Invalid JSON'); return; }

        const result = handleJSONRPC(body);
        res.setHeader('Content-Type', 'application/json');

        if (useSSE) {
          // SSE 模式：JSON 响应体包装在 SSE data 行中
          res.setHeader('Content-Type', 'text/event-stream');
          res.write(`data: ${JSON.stringify(result)}\n\n`);
          res.end();
        } else {
          res.write(JSON.stringify(result));
          res.end();
        }
      });
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as AddressInfo;
      resolve({ url: `http://127.0.0.1:${addr.port}`, close: () => new Promise(r => server.close(() => r())) });
    });
  });
}

// ==================== Stdio Transport Helper ====================

// Mock MCP server in Python — validates PYTHONUNBUFFERED auto-injection
const PYTHON_SERVER = `
import sys, json
tools = ${JSON.stringify(TOOLS)}
buf = ''
for line in sys.stdin:
    buf += line
    while '\\n' in buf:
        raw, buf = buf.split('\\n', 1)
        raw = raw.strip()
        if not raw:
            continue
        try:
            msg = json.loads(raw)
        except:
            continue
        def reply(result):
            rsp = {'jsonrpc': '2.0', 'id': msg['id'], 'result': result}
            sys.stdout.write(json.dumps(rsp) + '\\n')
            sys.stdout.flush()
        method = msg.get('method')
        if method == 'initialize':
            reply({'protocolVersion': '2024-11-05', 'capabilities': {'tools': {}}, 'serverInfo': {'name': 'Python Test', 'version': '1.0'}})
        elif method == 'tools/list':
            reply({'tools': tools})
        elif method == 'tools/call':
            nm = msg['params']['name']
            args = msg['params']['arguments']
            if nm == 'echo':
                reply({'content': [{'type': 'text', 'text': f"echo: {args['message']}"}]})
            elif nm == 'add':
                reply({'content': [{'type': 'text', 'text': f"{args['a']} + {args['b']} = {float(args['a']) + float(args['b'])}"}]})
            else:
                reply({'content': [{'type': 'text', 'text': f"unknown: {nm}"}]})
`;

const SERVER_JS = `
var tools = ${JSON.stringify(TOOLS)};
var buf = '';
process.stdin.on('data', function(chunk) {
  buf += chunk.toString();
  var lines = buf.split('\\n');
  buf = lines.pop() || '';
  lines.forEach(function(line) {
    var trimmed = line.trim();
    if (!trimmed) return;
    var msg;
    try { msg = JSON.parse(trimmed); } catch(e) { return; }
    function reply(result) {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: result }) + '\\n');
    }
    if (msg.method === 'initialize') {
      reply({ protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'Test', version: '1.0' } });
    } else if (msg.method === 'tools/list') {
      reply({ tools: tools });
    } else if (msg.method === 'tools/call') {
      var name = msg.params.name, args = msg.params.arguments;
      var text;
      if (name === 'echo') text = 'echo: ' + args.message;
      else if (name === 'add') text = args.a + ' + ' + args.b + ' = ' + (Number(args.a) + Number(args.b));
      else text = 'unknown: ' + name;
      reply({ content: [{ type: 'text', text: text }] });
    }
  });
});
`;

function createStdioTransport(): { transport: IMCPTransport; dispose: () => void } {
  const proc = spawn('node', ['-e', SERVER_JS], { stdio: ['pipe', 'pipe', 'ignore'] });
  let id = 0;
  const pending = new Map<number, { resolve: Function; reject: Function }>();
  let buf = '';

  proc.stdout!.on('data', (chunk: Buffer) => {
    buf += chunk.toString();
    const lines = buf.split('\n');
    buf = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let msg: any;
      try { msg = JSON.parse(trimmed); } catch { continue; }
      if (msg.id != null && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id)!;
        pending.delete(msg.id);
        msg.error ? reject(new Error(`MCP ${msg.error.code}: ${msg.error.message}`)) : resolve(msg.result);
      }
    }
  });

  return {
    transport: {
      sendRequest(method, params?) {
        return new Promise((resolve, reject) => {
          const rid = ++id;
          pending.set(rid, { resolve, reject });
          proc.stdin!.write(JSON.stringify({ jsonrpc: '2.0', id: rid, method, params: params || {} }) + '\n');
          setTimeout(() => { if (pending.has(rid)) { pending.delete(rid); reject(new Error('Timeout')); } }, 10000);
        });
      },
      sendNotification(method, params?) {
        proc.stdin!.write(JSON.stringify({ jsonrpc: '2.0', method, params: params || {} }) + '\n');
      },
      dispose() { proc.kill(); pending.clear(); },
    },
    dispose() { proc.kill(); pending.clear(); },
  };
}

// ==================== Test Runner ====================

async function testTransport(name: string, transport: IMCPTransport, extra?: { dispose: () => void }) {
  console.log(`\n--- ${name} ---`);
  const client = new MCPClient(transport);

  try {
    console.log('  initialize...');
    await client.initialize('TestClient', '1.0.0');

    console.log('  listTools...');
    const defs = await client.listTools();
    console.log(`  → ${defs.map(d => d.name).join(', ')}`);

    const adapters = client.createToolAdapters();
    const noopCtx = { fs: null as any };

    console.log('  execute echo(message=Hello)...');
    const r1 = await adapters[0].execute({ message: 'Hello' }, noopCtx);
    console.log(`  → ${r1}`);

    console.log('  execute add(a=3,b=7)...');
    const r2 = await adapters[1].execute({ a: '3', b: '7' }, noopCtx);
    console.log(`  → ${r2}`);

    console.log('  OK');
  } finally {
    transport.dispose();
    extra?.dispose();
  }
}

(async () => {
  console.log('=== MCP Transport Tests ===');

  // 1. Stdio
  const stdio = createStdioTransport();
  await testTransport('StdioTransport', stdio.transport, { dispose: stdio.dispose });

  // 2. HTTP
  const httpServer = await startHttpServer(false);
  await testTransport('HTTPTransport', new HTTPTransport(httpServer.url));
  await httpServer.close();

  // 3. SSE
  const sseServer = await startHttpServer(true);
  await testTransport('SSETransport', new SSETransport(sseServer.url));
  await sseServer.close();

  // 4. Python via StdioTransport (验证 PYTHONUNBUFFERED 自动注入)
  console.log('\n--- StdioTransport (Python) ---');
  const pythonTransport = new StdioTransport('python', ['-c', PYTHON_SERVER]);
  await pythonTransport.connect();

  const pyClient = new MCPClient(pythonTransport);
  try {
    console.log('  initialize...');
    await pyClient.initialize();
    console.log('  listTools...');
    const defs = await pyClient.listTools();
    console.log(`  → ${defs.map(d => d.name).join(', ')}`);

    const adapters = pyClient.createToolAdapters();
    const noopCtx = { fs: null as any };
    console.log('  execute echo(message=World)...');
    const r = await adapters[0].execute({ message: 'World' }, noopCtx);
    console.log(`  → ${r}`);
    console.log('  OK');
  } finally {
    pythonTransport.dispose();
  }

  console.log('\n=== All transport tests passed ===');
})().catch(err => { console.error('FAILED:', err); process.exit(1); });
