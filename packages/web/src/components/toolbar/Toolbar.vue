<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <button class="toolbar-btn" title="Open Folder" @click="$emit('open-folder')">
        [O] Open
      </button>
      <button class="toolbar-btn" title="New File" @click="$emit('new-file')">
        [+] New
      </button>
      <button class="toolbar-btn" title="Save (Ctrl+S)" @click="$emit('save')">
        [S] Save
      </button>
    </div>
    <div class="toolbar-center">
      <span class="toolbar-title">VibeEditor</span>
    </div>
    <div class="toolbar-right">
      <button class="toolbar-btn agent-btn" title="Toggle Agent Panel" @click="$emit('toggle-agent')">
        [AI] Agent
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  'open-folder': [];
  'open-file': [];
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
  gap: 4px;
}
.toolbar-center {
  color: var(--text-secondary);
  font-size: 13px;
}
.toolbar-btn {
  background: transparent;
  border: none;
  color: var(--text-primary);
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
}
.toolbar-btn:hover {
  background: var(--bg-hover);
}
.agent-btn {
  color: var(--accent-color);
}
</style>
