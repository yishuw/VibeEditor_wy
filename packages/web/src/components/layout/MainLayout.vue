<template>
  <div class="main-layout">
    <Toolbar
      :env="fs.env"
      :workspace-mode="store.workspaceMode"
      @open-folder="handleOpenFolder"
      @connect-server="handleConnectServer"
      @open-local-file="fs.openLocalFile"
      @save="fs.saveCurrentFile"
      @new-file="store.newUntitled"
      @toggle-agent="showAgent = !showAgent"
    />
    <div class="main-content">
      <div class="sidebar" :style="{ width: sidebarWidth + 'px' }">
        <FileTree
          :nodes="store.fileTreeNodes"
          :workspace-root="store.workspaceRoot"
          :workspace-mode="store.workspaceMode"
          :loading="fs.isLoading"
          :expanded-dirs="expandedDirs"
          :loading-dirs="loadingDirs"
          :dir-children="dirChildren"
          @select-file="fs.openAndReadFile"
          @expand-dir="handleExpandDir"
        />
      </div>
      <div class="resize-handle" @mousedown="startResize"></div>
      <div class="editor-area">
        <div class="tabs-bar">
          <div
            v-for="tab in store.tabs"
            :key="tab.id"
            class="tab"
            :class="{ active: tab.id === store.activeTabId }"
            @click="store.setActiveTab(tab.id)"
          >
            <span class="tab-name">{{ tab.name }}</span>
            <span v-if="tab.isDirty" class="tab-dirty">*</span>
            <span class="tab-close" @click.stop="store.closeTab(tab.id)">x</span>
          </div>
        </div>
        <div class="editor-container">
          <MonacoEditor
            v-if="store.activeTab"
            :key="store.activeTab.id"
            :content="store.activeTab.content"
            :language="store.activeTab.language"
            @content-change="(c: string) => store.updateContent(store.activeTab!.id, c)"
          />
          <div v-else class="editor-placeholder">
            <div class="placeholder-content">
              <p class="placeholder-title">VibeEditor</p>
              <p class="placeholder-hint">Open a folder or file to get started</p>
              <div class="placeholder-actions">
                <button class="placeholder-btn" @click="fs.openFolderDialog">📂 Open Folder</button>
                <button
                  v-if="fs.env.value === 'browser' || fs.env.value === 'server'"
                  class="placeholder-btn"
                  @click="fs.connectToServer"
                >
                  🌐 Browse Server
                </button>
                <button
                  v-if="fs.env.value === 'browser'"
                  class="placeholder-btn"
                  @click="fs.openLocalFile"
                >
                  📄 Open File
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showAgent" class="agent-sidebar">
        <AgentPanel />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useEditorStore } from '../../stores/editor';
import { useFileSystem } from '../../composables/useFileSystem';
import Toolbar from '../toolbar/Toolbar.vue';
import FileTree from '../file-tree/FileTree.vue';
import MonacoEditor from '../editor/MonacoEditor.vue';
import AgentPanel from '../agent/AgentPanel.vue';

const store = useEditorStore();
const fs = useFileSystem();

const showAgent = ref(false);
const sidebarWidth = ref(260);
const expandedDirs = ref(new Set<string>());
const loadingDirs = ref(new Set<string>());
const dirChildren = ref<Record<string, any[]>>({});
let isResizing = false;

function clearDirState() {
  expandedDirs.value = new Set();
  loadingDirs.value = new Set();
  dirChildren.value = {};
}

async function handleOpenFolder() {
  clearDirState();
  await fs.openFolderDialog();
}

async function handleConnectServer() {
  clearDirState();
  await fs.connectToServer();
}

async function handleExpandDir(dirPath: string) {
  const s = new Set(expandedDirs.value);
  if (s.has(dirPath)) {
    s.delete(dirPath);
    expandedDirs.value = s;
    return;
  }
  s.add(dirPath);
  expandedDirs.value = s;

  loadingDirs.value = new Set([...loadingDirs.value, dirPath]);
  try {
    const entries = await fs.client.value.readDir(dirPath);
    dirChildren.value = { ...dirChildren.value, [dirPath]: entries };
  } catch { /* ignore */ }
  loadingDirs.value = new Set([...loadingDirs.value].filter(d => d !== dirPath));
}

function startResize(e: MouseEvent) {
  isResizing = true;
  const startX = e.clientX;
  const startWidth = sidebarWidth.value;

  const onMove = (ev: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = startWidth + (ev.clientX - startX);
    sidebarWidth.value = Math.max(150, Math.min(500, newWidth));
  };

  const onUp = () => {
    isResizing = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}
</script>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
}
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.sidebar {
  background: var(--bg-secondary);
  overflow-y: auto;
  flex-shrink: 0;
}
.resize-handle {
  width: 4px;
  cursor: col-resize;
  background: var(--border-color);
  flex-shrink: 0;
}
.resize-handle:hover {
  background: var(--accent-color);
}
.editor-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.tabs-bar {
  display: flex;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  overflow-x: auto;
  flex-shrink: 0;
}
.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  border-right: 1px solid var(--border-color);
  white-space: nowrap;
  user-select: none;
}
.tab.active {
  background: var(--bg-primary);
  color: var(--text-primary);
}
.tab:hover {
  background: var(--bg-hover);
}
.tab-dirty {
  color: var(--accent-color);
}
.tab-close {
  font-size: 12px;
  opacity: 0.6;
}
.tab-close:hover {
  opacity: 1;
  color: #f44747;
}
.editor-container {
  flex: 1;
  overflow: hidden;
}
.editor-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.placeholder-content {
  text-align: center;
}
.placeholder-title {
  font-size: 28px;
  font-weight: 300;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.placeholder-hint {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 24px;
}
.placeholder-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}
.placeholder-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
}
.placeholder-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
}
.agent-sidebar {
  width: 350px;
  flex-shrink: 0;
  border-left: 1px solid var(--border-color);
}
</style>
