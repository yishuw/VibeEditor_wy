<template>
  <div class="file-tree">
    <div class="tree-header">
      <span class="tree-title">{{ workspaceRoot || 'Files' }}</span>
    </div>
    <div class="tree-body">
      <div v-if="nodes.length === 0" class="tree-empty">
        No files open
      </div>
      <TreeNode
        v-for="node in nodes"
        :key="node.path"
        :node="node"
        :depth="0"
        @select="$emit('select-file', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import TreeNode from './TreeNode.vue';

defineProps<{
  nodes: any[];
  workspaceRoot: string;
}>();

defineEmits<{
  'select-file': [path: string];
}>();
</script>

<style scoped>
.file-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.tree-header {
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}
.tree-body {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 8px;
}
.tree-empty {
  padding: 20px 12px;
  color: var(--text-secondary);
  font-size: 13px;
  text-align: center;
}
</style>
