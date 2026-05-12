<template>
  <div>
    <div
      class="tree-node"
      :style="{ paddingLeft: depth * 16 + 8 + 'px' }"
      @click="toggle"
    >
      <span v-if="node.isDirectory" class="node-arrow">{{ expanded ? 'v' : '>' }}</span>
      <span v-else class="node-arrow-placeholder"></span>
      <span class="node-icon">{{ node.isDirectory ? (expanded ? '[D]' : '[D]') : '[F]' }}</span>
      <span class="node-name" :title="node.path">{{ node.name }}</span>
    </div>
    <template v-if="expanded && node.children">
      <TreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
        @select="$emit('select', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  node: any;
  depth: number;
}>();

const emit = defineEmits<{
  'select': [path: string];
}>();

const expanded = ref(false);

function toggle() {
  if (props.node.isDirectory) {
    expanded.value = !expanded.value;
  } else {
    emit('select', props.node.path);
  }
}
</script>

<style scoped>
.tree-node {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  user-select: none;
}
.tree-node:hover {
  background: var(--bg-hover);
}
.node-arrow {
  width: 12px;
  font-size: 10px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.node-arrow-placeholder {
  width: 12px;
  flex-shrink: 0;
}
.node-icon {
  margin-right: 6px;
  font-size: 11px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.node-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
