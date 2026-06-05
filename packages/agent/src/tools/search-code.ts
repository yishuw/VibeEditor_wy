import { readFileSync, readdirSync } from 'fs';
import * as path from 'path';
import type { ITool, ToolInputSchema, ToolExecutionContext, ToolAnnotations } from '../types/tool';

const inputSchema: ToolInputSchema = {
  type: 'object',
  properties: {
    pattern: { type: 'string', description: 'Regex pattern to search for' },
    path: { type: 'string', description: 'Absolute directory path to search in', default: '.' },
    maxResults: { type: 'string', description: 'Max results to return (default: 20)', default: '20' },
  },
  required: ['pattern'],
};

const annotations: ToolAnnotations = {
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: false,
};

function resolvePath(root: string, target: string): string {
  const abs = path.resolve(root, target);
  if (!abs.startsWith(root + path.sep) && abs !== root) {
    throw new Error(`Path traversal not allowed: ${target}`);
  }
  return abs;
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.vibeeditor']);

export class SearchCodeTool implements ITool {
  readonly name = 'search_code';
  readonly description = 'Search code with regex pattern';
  readonly usage = '<search_code pattern="regex" [path="dir" maxResults="20"]/>';
  readonly inputSchema = inputSchema;
  readonly annotations = annotations;

  async execute(params: Record<string, string>, context: ToolExecutionContext): Promise<string> {
    const pattern = params.pattern;
    const searchPath = params.path || '.';
    const maxResults = parseInt(params.maxResults || '20');

    // Resolve search path — if absolute, validate it; if relative, resolve against workspaceRoot
    const rootPath = context.workspaceRoot;
    const absSearchPath = resolvePath(rootPath, searchPath);

    const results: string[] = [];
    let count = 0;

    let regex: RegExp;
    try {
      regex = new RegExp(pattern, 'gi');
    } catch {
      return `Invalid regex pattern: "${pattern}"`;
    }

    const matchInFile = (filePath: string) => {
      if (count >= maxResults) return;
      try {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length && count < maxResults; i++) {
          if (regex.test(lines[i])) {
            regex.lastIndex = 0;
            // Show path relative to workspace root for readability
            const relPath = path.relative(rootPath, filePath);
            results.push(`${relPath}:${i + 1}: ${lines[i].trim().substring(0, 120)}`);
            count++;
          }
        }
      } catch { /* skip unreadable files */ }
    };

    const walkDir = (dirPath: string) => {
      if (count >= maxResults) return;
      let entries;
      try {
        entries = readdirSync(dirPath, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        if (count >= maxResults) return;
        const entryAbsPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          if (SKIP_DIRS.has(entry.name)) continue;
          walkDir(entryAbsPath);
        } else {
          matchInFile(entryAbsPath);
        }
      }
    };

    walkDir(absSearchPath);

    if (results.length === 0) return `No matches found for "${pattern}"`;
    return `## Search results for "${pattern}":\n${results.join('\n')}`;
  }
}
