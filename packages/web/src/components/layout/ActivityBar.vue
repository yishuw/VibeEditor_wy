<template>
  <div class="activity-bar">
    <div class="activity-top">
      <n-button
        v-for="item in items"
        :key="item.id"
        quaternary
        class="activity-item"
        :class="{ active: activeId === item.id }"
        :title="item.label"
        @click="$emit('select', item.id)"
      >
        <template #icon>
          <n-icon size="22" :component="item.icon" />
        </template>
      </n-button>
    </div>
    <div v-if="bottomItems.length > 0" class="activity-bottom">
      <n-button
        v-for="item in bottomItems"
        :key="item.id"
        quaternary
        class="activity-item"
        :class="{ active: activeId === item.id }"
        :title="item.label"
        @click="$emit('select', item.id)"
      >
        <template #icon>
          <n-icon size="22" :component="item.icon" />
        </template>
      </n-button>
    </div>
    <slot name="bottom" />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { NButton, NIcon } from 'naive-ui'

/** 活动栏项目 */
export interface ActivityItem {
  id: string
  label: string
  icon: Component
}

defineProps<{
  items: ActivityItem[]
  bottomItems: ActivityItem[]
  activeId: string
}>()

defineEmits<{
  select: [id: string]
}>()
</script>

<style scoped>
.activity-bar {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 48px;
  background: var(--bg-tertiary);
  border-right: 1px solid var(--border-color);
  flex-shrink: 0;
  user-select: none;
}
.activity-top,
.activity-bottom {
  display: flex;
  flex-direction: column;
}
.activity-item {
  width: 48px;
  height: 48px;
  color: #858585;
  border-radius: 0;
}
.activity-item:hover {
  color: var(--text-primary);
}
.activity-item.active {
  color: var(--text-primary);
  border-left: 2px solid var(--text-primary);
}
</style>
