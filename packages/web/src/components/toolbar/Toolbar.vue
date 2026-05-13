<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <button class="toolbar-btn" title="Open Folder" @click="$emit('open-folder')">
        📂 Open
      </button>
      <button v-if="env === 'browser' || env === 'server'" class="toolbar-btn" title="Browse Server Files" @click="$emit('connect-server')">
        🌐 Server
      </button>
      <button v-if="env === 'browser'" class="toolbar-btn" title="Open Local File" @click="$emit('open-local-file')">
        📄 File
      </button>
      <span class="toolbar-sep"></span>
      <button class="toolbar-btn" title="New File" @click="$emit('new-file')">
        + New
      </button>
      <button class="toolbar-btn" title="Save (Ctrl+S)" @click="$emit('save')">
        💾 Save
      </button>
    </div>
    <div class="toolbar-center">
      <span class="toolbar-title">VibeEditor</span>
      <span v-if="workspaceMode" class="toolbar-mode">
        {{ workspaceMode === 'local' ? '[Local]' : '[Server]' }}
      </span>
    </div>
    <div class="toolbar-right">
      <button class="toolbar-btn agent-btn" title="Toggle Agent Panel" @click="$emit('toggle-agent')">
        🤖 Agent
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WorkspaceMode } from '../../stores/editor';

defineProps<{
  env: string;
  workspaceMode: WorkspaceMode;
}>();

defineEmits<{
  'open-folder': [];
  'connect-server': [];
  'open-local-file': [];
  'save': [];
  'new-file': [];
  'toggle-agent': [];
}>();
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  padding: 0 8px;
  flex-shrink: 0;
}
.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}
.toolbar-center {
  display: flex;
  align-items: center;
  gap: 8px;
}
.toolbar-title {
  color: var(--text-secondary);
  font-size: 13px;
}
.toolbar-mode {
  font-size: 10px;
  color: var(--accent-color);
  background: rgba(0, 122, 204, 0.15);
  padding: 1px 6px;
  border-radius: 3px;
}
.toolbar-sep {
  width: 1px;
  height: 20px;
  background: var(--border-color);
  margin: 0 4px;
}
.toolbar-btn {
  background: transparent;
  border: none;
  color: var(--text-primary);
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  white-space: nowrap;
}
.toolbar-btn:hover {
  background: var(--bg-hover);
}
.agent-btn {
  color: var(--accent-color);
}
</style>
