<template>
  <div class="main-layout">
    <Toolbar
      @open-folder="fs.openFolderDialog"
      @open-file="fs.openFileDialog"
      @save="fs.saveCurrentFile"
      @new-file="store.newUntitled"
      @toggle-agent="showAgent = !showAgent"
    />
    <div class="main-content">
      <div class="sidebar" :style="{ width: sidebarWidth + 'px' }">
        <FileTree
          :nodes="store.fileTreeNodes"
          :workspace-root="store.workspaceRoot"
          @select-file="fs.openAndReadFile"
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
            <p>Open a file or folder to get started</p>
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
let isResizing = false;

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
  color: var(--text-secondary);
  font-size: 16px;
}
.agent-sidebar {
  width: 350px;
  flex-shrink: 0;
  border-left: 1px solid var(--border-color);
}
</style>
