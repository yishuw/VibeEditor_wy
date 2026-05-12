export interface EditorTab {
  id: string;
  path: string;
  name: string;
  language: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
  isUntitled: boolean;
}

export interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;
}

export interface CursorPosition {
  lineNumber: number;
  column: number;
}

export interface TextSelection {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface EditOperation {
  type: 'insert' | 'delete' | 'replace';
  range: TextSelection;
  text?: string;
}

export function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript',
    json: 'json', html: 'html', css: 'css', scss: 'scss',
    md: 'markdown', py: 'python', rs: 'rust', go: 'go',
    java: 'java', cpp: 'cpp', c: 'c', h: 'c',
    yaml: 'yaml', yml: 'yaml', xml: 'xml', sql: 'sql',
    sh: 'shell', bat: 'bat', ps1: 'powershell',
    txt: 'plaintext', log: 'plaintext',
  };
  return languageMap[ext || ''] || 'plaintext';
}
