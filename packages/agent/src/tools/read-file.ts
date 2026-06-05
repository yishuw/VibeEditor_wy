import { readFileSync } from 'fs';
import * as path from 'path';
import type { ITool, ToolInputSchema, ToolExecutionContext, ToolAnnotations } from '../types/tool';

const inputSchema: ToolInputSchema = {
  type: 'object',
  properties: {
    path: { type: 'string', description: 'Absolute path to the file to read' },
  },
  required: ['path'],
};

const annotations: ToolAnnotations = {
  readOnlyHint: true,
  idempotentHint: true,
};

function resolvePath(root: string, target: string): string {
  const abs = path.resolve(root, target);
  if (!abs.startsWith(root + path.sep) && abs !== root) {
    throw new Error(`Path traversal not allowed: ${target}`);
  }
  return abs;
}

export class ReadFileTool implements ITool {
  readonly name = 'read_file';
  readonly description = 'Read a file not currently in context';
  readonly usage = '<read_file path="path/to/file"/>';
  readonly inputSchema = inputSchema;
  readonly annotations = annotations;

  async execute(params: Record<string, string>, context: ToolExecutionContext): Promise<string> {
    try {
      const absPath = resolvePath(context.workspaceRoot, params.path);
      const content = readFileSync(absPath, 'utf-8');
      return `## File: ${params.path}\n\`\`\`\n${content}\n\`\`\``;
    } catch (e: any) {
      return `Error reading ${params.path}: ${e.message}`;
    }
  }
}
