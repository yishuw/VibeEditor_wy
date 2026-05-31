<template>
  <div class="tool-list">
    <div
      v-for="tool in tools"
      :key="tool.name"
      class="tool-item"
    >
      <span class="tool-name">{{ tool.name }}</span>
      <span class="tool-desc">{{ tool.description }}</span>
    </div>
    <div v-if="tools.length === 0" class="tool-empty">
      No tools discovered
    </div>
  </div>
</template>

<script setup lang="ts">
import type { McpToolInfo } from '@vibeeditor/agent';

defineProps<{
  tools: McpToolInfo[];
}>();
</script>

<style scoped>
.tool-list {
  padding: 6px 0 6px 12px;
  border-top: 1px solid var(--border-color);
  max-height: 160px;
  overflow-y: auto;
}
.tool-item {
  display: flex;
  flex-direction: column;
  padding: 4px 0;
}
.tool-name {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  color: var(--accent-color);
}
.tool-desc {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-top: 1px;
}
.tool-empty {
  font-size: 11px;
  color: var(--text-secondary);
  font-style: italic;
  padding: 4px 0;
}
</style>
