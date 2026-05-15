import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

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

export type WorkspaceMode = 'local' | 'server';

let tabCounter = 0;

function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    json: 'json', html: 'html', css: 'css', scss: 'scss',
    md: 'markdown', py: 'python', rs: 'rust', go: 'go',
    java: 'java', cpp: 'cpp', c: 'c', yaml: 'yaml', yml: 'yaml',
    xml: 'xml', sql: 'sql', sh: 'shell', ps1: 'powershell',
    vue: 'html', svg: 'xml',
  };
  return map[ext || ''] || 'plaintext';
}

export const useEditorStore = defineStore('editor', () => {
  const tabs = ref<EditorTab[]>([]);
  const activeTabId = ref<string | null>(null);
  const fileTreeNodes = ref<any[]>([]);
  const workspaceRoot = ref<string>('');
  const workspaceMode = ref<WorkspaceMode>('server');

  const activeTab = computed(() => tabs.value.find(t => t.id === activeTabId.value) ?? null);

  const openFile = (filePath: string, content: string) => {
    const existing = tabs.value.find(t => t.path === filePath);
    if (existing) {
      activeTabId.value = existing.id;
      return;
    }
    const id = `tab_${++tabCounter}`;
    const tab: EditorTab = {
      id,
      path: filePath,
      name: filePath.split('/').pop() || filePath.split('\\').pop() || filePath,
      language: getLanguageFromPath(filePath),
      content,
      originalContent: content,
      isDirty: false,
      isUntitled: false,
    };
    tabs.value.push(tab);
    activeTabId.value = id;
  };

  const newUntitled = () => {
    const id = `tab_${++tabCounter}`;
    const tab: EditorTab = {
      id,
      path: `untitled-${tabCounter}`,
      name: `untitled-${tabCounter}`,
      language: 'plaintext',
      content: '',
      originalContent: '',
      isDirty: false,
      isUntitled: true,
    };
    tabs.value.push(tab);
    activeTabId.value = id;
  };

  const closeTab = (tabId: string) => {
    const idx = tabs.value.findIndex(t => t.id === tabId);
    if (idx === -1) return;
    tabs.value.splice(idx, 1);
    if (activeTabId.value === tabId) {
      activeTabId.value = tabs.value.length > 0 ? tabs.value[Math.min(idx, tabs.value.length - 1)].id : null;
    }
  };

  const updateContent = (tabId: string, content: string) => {
    const tab = tabs.value.find(t => t.id === tabId);
    if (tab) {
      tab.content = content;
      tab.isDirty = content !== tab.originalContent;
    }
  };

  const saveTab = (tabId: string) => {
    const tab = tabs.value.find(t => t.id === tabId);
    if (tab) {
      tab.originalContent = tab.content;
      tab.isDirty = false;
    }
  };

  const setActiveTab = (tabId: string) => {
    if (tabs.value.find(t => t.id === tabId)) {
      activeTabId.value = tabId;
    }
  };

  const setTabPath = (tabId: string, newPath: string) => {
    const tab = tabs.value.find(t => t.id === tabId);
    if (tab) {
      tab.path = newPath;
      tab.name = newPath.split('/').pop() || newPath.split('\\').pop() || newPath;
      tab.language = getLanguageFromPath(newPath);
      tab.isUntitled = false;
    }
  };

  return {
    tabs, activeTabId, activeTab, fileTreeNodes, workspaceRoot, workspaceMode,
    openFile, newUntitled, closeTab, updateContent, saveTab, setActiveTab, setTabPath,
  };
});
