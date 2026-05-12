import { EditorState, EditorTab, getLanguageFromPath } from './types';

let tabCounter = 0;

export function createTab(filePath: string, content: string, isUntitled = false): EditorTab {
  const id = `tab_${++tabCounter}_${Date.now()}`;
  return {
    id,
    path: filePath,
    name: filePath.split('/').pop() || filePath,
    language: getLanguageFromPath(filePath),
    content,
    originalContent: content,
    isDirty: false,
    isUntitled,
  };
}

export function createEmptyState(): EditorState {
  return { tabs: [], activeTabId: null };
}

export function addTab(state: EditorState, tab: EditorTab): EditorState {
  const existing = state.tabs.find(t => t.path === tab.path);
  if (existing) {
    return { ...state, activeTabId: existing.id };
  }
  return {
    tabs: [...state.tabs, tab],
    activeTabId: tab.id,
  };
}

export function removeTab(state: EditorState, tabId: string): EditorState {
  const tabs = state.tabs.filter(t => t.id !== tabId);
  let activeTabId = state.activeTabId;
  if (activeTabId === tabId) {
    activeTabId = tabs.length > 0 ? tabs[tabs.length - 1].id : null;
  }
  return { tabs, activeTabId };
}

export function updateTabContent(state: EditorState, tabId: string, content: string): EditorState {
  return {
    ...state,
    tabs: state.tabs.map(t =>
      t.id === tabId ? { ...t, content, isDirty: content !== t.originalContent } : t
    ),
  };
}

export function markTabSaved(state: EditorState, tabId: string): EditorState {
  return {
    ...state,
    tabs: state.tabs.map(t =>
      t.id === tabId ? { ...t, originalContent: t.content, isDirty: false } : t
    ),
  };
}

export function setActiveTab(state: EditorState, tabId: string): EditorState {
  if (!state.tabs.find(t => t.id === tabId)) return state;
  return { ...state, activeTabId: tabId };
}
