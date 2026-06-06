<template>
  <n-card size="small" class="server-item">
    <div class="server-main">
      <div class="server-info">
        <n-text strong class="server-name">{{ server.name }}</n-text>
        <n-tag :type="tagType" size="small" :bordered="false">{{ typeLabel }}</n-tag>
      </div>
      <div class="server-actions">
        <n-switch :value="server.enabled" size="small" @update:value="$emit('toggle')" />
        <n-button text size="tiny" @click="expanded = !expanded">
          {{ $t('mcp.tools', { n: server.toolCount }) }}
        </n-button>
        <n-button text size="tiny" @click="$emit('edit')">
          <template #icon><n-icon :component="CreateOutline" /></template>
        </n-button>
        <n-button text size="tiny" @click="$emit('delete')">
          <template #icon><n-icon :component="TrashOutline" /></template>
        </n-button>
      </div>
    </div>
    <McpToolList v-if="expanded && server.tools" :tools="server.tools" />
  </n-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NCard, NButton, NIcon, NSwitch, NTag, NText } from 'naive-ui'
import { CreateOutline, TrashOutline } from '@vicons/ionicons5'
import type { McpServerUI } from '../../types/mcp-ui'
import McpToolList from './McpToolList.vue'

const props = defineProps<{
  server: McpServerUI
}>()

defineEmits<{
  edit: []
  delete: []
  toggle: []
}>()

const expanded = ref(false)

const typeLabel = computed(() => {
  const t: string = props.server.config.type
  if (t === 'stdio') return 'STDIO'
  if (t === 'http') return 'HTTP'
  if (t === 'sse') return 'SSE'
  return t.toUpperCase()
})

const tagType = computed(() => {
  const t = props.server.config.type
  if (t === 'stdio') return 'success' as const
  if (t === 'http') return 'info' as const
  if (t === 'sse') return 'warning' as const
  return 'default' as const
})
</script>

<style scoped>
.server-item {
  margin: 6px 8px;
}
.server-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.server-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}
.server-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
}
.server-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
</style>
