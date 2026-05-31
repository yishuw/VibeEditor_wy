<template>
  <div class="toolbar" @dblclick="handleToolbarDblClick">
    <div class="toolbar-left">
      <button class="toolbar-btn toolbar-toggle-btn" :title="sidebarCollapsed ? $t('toolbar.showSidebar') : $t('toolbar.hideSidebar')" @click="$emit('toggle-sidebar')">
        <span class="sidebar-toggle-icon">☰</span>
      </button>
      <div class="dropdown">
        <button class="toolbar-btn dropdown-trigger">
          {{ $t('toolbar.file') }}
          <span class="dropdown-arrow">▾</span>
        </button>
        <div class="dropdown-menu">
          <button class="dropdown-item" :title="$t('toolbar.newFile') + ' (' + $t('toolbar.newFileShort') + ')'" @click="$emit('new-file')">
            {{ $t('toolbar.newFile') }}
            <span class="dropdown-shortcut">{{ $t('toolbar.newFileShort') }}</span>
          </button>
          <button class="dropdown-item" :title="$t('toolbar.newFolder')" @click="$emit('new-folder')">
            {{ $t('toolbar.newFolder') }}
          </button>
          <div class="dropdown-sep"></div>
          <button class="dropdown-item" :title="$t('toolbar.openFolder')" @click="$emit('open-folder')">
            {{ $t('toolbar.openFolder') }}
          </button>
          <button v-if="env === 'browser' || env === 'server'" class="dropdown-item" :title="$t('toolbar.browseServer')" @click="$emit('connect-server')">
            {{ $t('toolbar.browseServer') }}
          </button>
          <button v-if="env === 'browser'" class="dropdown-item" :title="$t('toolbar.openFile')" @click="$emit('open-local-file')">
            {{ $t('toolbar.openFile') }}
          </button>
          <div class="dropdown-sep"></div>
          <button class="dropdown-item" :title="$t('toolbar.save') + ' (' + $t('toolbar.saveShort') + ')'" @click="$emit('save')">
            {{ $t('toolbar.save') }}
            <span class="dropdown-shortcut">{{ $t('toolbar.saveShort') }}</span>
          </button>
        </div>
      </div>
      <div class="dropdown">
        <button class="toolbar-btn dropdown-trigger">
          {{ $t('toolbar.edit') }}
          <span class="dropdown-arrow">▾</span>
        </button>
        <div class="dropdown-menu">
          <button class="dropdown-item" :title="$t('toolbar.cut') + ' (' + $t('toolbar.cutShort') + ')'" @click="$emit('edit-cut')">
            {{ $t('toolbar.cut') }}
            <span class="dropdown-shortcut">{{ $t('toolbar.cutShort') }}</span>
          </button>
          <button class="dropdown-item" :title="$t('toolbar.copy') + ' (' + $t('toolbar.copyShort') + ')'" @click="$emit('edit-copy')">
            {{ $t('toolbar.copy') }}
            <span class="dropdown-shortcut">{{ $t('toolbar.copyShort') }}</span>
          </button>
          <button class="dropdown-item" :title="$t('toolbar.paste') + ' (' + $t('toolbar.pasteShort') + ')'" @click="$emit('edit-paste')">
            {{ $t('toolbar.paste') }}
            <span class="dropdown-shortcut">{{ $t('toolbar.pasteShort') }}</span>
          </button>
          <div class="dropdown-sep"></div>
          <button class="dropdown-item" :title="$t('toolbar.undo') + ' (' + $t('toolbar.undoShort') + ')'" @click="$emit('edit-undo')">
            {{ $t('toolbar.undo') }}
            <span class="dropdown-shortcut">{{ $t('toolbar.undoShort') }}</span>
          </button>
          <button class="dropdown-item" :title="$t('toolbar.redo') + ' (' + $t('toolbar.redoShort') + ')'" @click="$emit('edit-redo')">
            {{ $t('toolbar.redo') }}
            <span class="dropdown-shortcut">{{ $t('toolbar.redoShort') }}</span>
          </button>
          <div class="dropdown-sep"></div>
          <button class="dropdown-item" :title="$t('toolbar.find') + ' (' + $t('toolbar.findShort') + ')'" @click="$emit('edit-find')">
            {{ $t('toolbar.find') }}
            <span class="dropdown-shortcut">{{ $t('toolbar.findShort') }}</span>
          </button>
          <button class="dropdown-item" :title="$t('toolbar.replace') + ' (' + $t('toolbar.replaceShort') + ')'" @click="$emit('edit-replace')">
            {{ $t('toolbar.replace') }}
            <span class="dropdown-shortcut">{{ $t('toolbar.replaceShort') }}</span>
          </button>
        </div>
      </div>
      <div class="dropdown">
        <button class="toolbar-btn dropdown-trigger">
          {{ $t('toolbar.help') }}
          <span class="dropdown-arrow">▾</span>
        </button>
        <div class="dropdown-menu">
          <button class="dropdown-item" @click="$emit('show-about')">
            {{ $t('about.title') }}
          </button>
        </div>
      </div>
    </div>
    <div class="toolbar-center">
      <span class="toolbar-title">{{ $t('toolbar.appName') }}</span>
    </div>
    <div class="toolbar-right">
      <span v-if="workspaceMode" class="toolbar-badge">
        {{ workspaceMode.toUpperCase() }}
      </span>
      <div v-if="env === 'electron'" class="window-controls">
        <button class="win-btn win-minimize" title="Minimize" @click="handleMinimize">
          <svg width="10" height="10" viewBox="0 0 10 10"><rect y="4" width="10" height="1" fill="currentColor"/></svg>
        </button>
        <button class="win-btn win-maximize" :title="isMaximized ? 'Restore' : 'Maximize'" @click="handleToggleMaximize">
          <svg v-if="isMaximized" width="10" height="10" viewBox="0 0 10 10">
            <rect x="1" y="2" width="7" height="6" fill="none" stroke="currentColor" stroke-width="1"/>
            <rect x="3" y="0" width="7" height="6" fill="var(--bg-tertiary)" stroke="currentColor" stroke-width="1"/>
          </svg>
          <svg v-else width="10" height="10" viewBox="0 0 10 10">
            <rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1"/>
          </svg>
        </button>
        <button class="win-btn win-close" title="Close" @click="handleClose">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" stroke-width="1.2"/>
            <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" stroke-width="1.2"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WorkspaceMode } from '../../stores/editor';
import { ref, onMounted } from 'vue';

defineProps<{
  env: string;
  workspaceMode: WorkspaceMode;
  sidebarCollapsed?: boolean;
}>();

defineEmits<{
  'open-folder': [];
  'connect-server': [];
  'open-local-file': [];
  'save': [];
  'new-file': [];
  'new-folder': [];
  'toggle-sidebar': [];
  'edit-cut': [];
  'edit-copy': [];
  'edit-paste': [];
  'edit-undo': [];
  'edit-redo': [];
  'edit-find': [];
  'edit-replace': [];
  'show-about': [];
}>();


const isMaximized = ref(false);

onMounted(async () => {
  if (window.electronAPI) {
    isMaximized.value = await window.electronAPI.isMaximized();
    window.electronAPI.onMaximizeChange((max: boolean) => {
      isMaximized.value = max;
    });
  }
});

function handleMinimize() {
  window.electronAPI?.minimizeWindow();
}

async function handleToggleMaximize() {
  const api = window.electronAPI;
  if (!api) return;
  if (await api.isMaximized()) {
    api.unmaximizeWindow();
  } else {
    api.maximizeWindow();
  }
}

function handleClose() {
  window.electronAPI?.closeWindow();
}

function handleToolbarDblClick() {
  if (window.electronAPI) {
    handleToggleMaximize();
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  padding: 0 4px;
  flex-shrink: 0;
  user-select: none;
  -webkit-app-region: drag;
}
.toolbar-left {
  display: flex;
  align-items: center;
  height: 100%;
  -webkit-app-region: no-drag;
}
.toolbar-right {
  display: flex;
  align-items: center;
  height: 100%;
  -webkit-app-region: no-drag;
}
.toolbar-center {
  display: flex;
  align-items: center;
  height: 100%;
}
.toolbar-title {
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.3px;
}
.toolbar-badge {
  font-size: 10px;
  font-weight: 500;
  color: var(--accent-color);
  background: rgba(0, 122, 204, 0.12);
  padding: 1px 6px;
  border-radius: 3px;
  margin-right: 8px;
  letter-spacing: 0.3px;
}
.toolbar-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 3px 8px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 3px;
  white-space: nowrap;
  height: 24px;
  line-height: 18px;
  outline: none;
  -webkit-app-region: no-drag;
}
.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
}
.sidebar-toggle-icon {
  font-size: 16px;
  line-height: 1;
}
.toolbar-toggle-btn {
  margin-right: 4px;
  font-size: 14px;
  padding: 3px 6px;
}

.dropdown {
  position: relative;
  display: flex;
  align-items: center;
  -webkit-app-region: no-drag;
}
.dropdown::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  height: 8px;
  pointer-events: auto;
}
.dropdown-arrow {
  font-size: 8px;
  opacity: 0.6;
}
.dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 2px;
  min-width: 180px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
  padding: 4px 0;
}
.dropdown:hover .dropdown-menu {
  display: block;
}
.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 5px 12px;
  font-size: 12px;
  color: var(--text-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
}
.dropdown-item:hover {
  background: rgba(0, 122, 204, 0.15);
}
.dropdown-shortcut {
  margin-left: 24px;
  font-size: 10px;
  color: var(--text-secondary);
}
.dropdown-sep {
  height: 1px;
  background: var(--border-color);
  margin: 4px 8px;
}

.window-controls {
  display: flex;
  align-items: center;
  height: 100%;
  margin-left: auto;
}
.win-btn {
  width: 46px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  -webkit-app-region: no-drag;
}
.win-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}
.win-close:hover {
  background: #e81123;
  color: #fff;
}
</style>
