<template>
  <div class="right-toolbar">
    <div class="rt-top">
      <n-button
        v-for="item in items"
        :key="item.id"
        quaternary
        class="rt-item"
        :class="{ active: activeId === item.id }"
        :title="item.label"
        @click="$emit('select', item.id)"
      >
        <template #icon>
          <n-icon size="22" :component="item.icon" />
        </template>
      </n-button>
    </div>
    <div v-if="bottomItems.length > 0" class="rt-bottom">
      <n-button
        v-for="item in bottomItems"
        :key="item.id"
        quaternary
        class="rt-item"
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

export interface RightToolbarItem {
  id: string
  label: string
  icon: Component
}

defineProps<{
  items: RightToolbarItem[]
  bottomItems: RightToolbarItem[]
  activeId: string | null
}>()

defineEmits<{
  select: [id: string]
}>()
</script>

<style scoped>
.right-toolbar {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 48px;
  background: var(--bg-tertiary);
  border-left: 1px solid var(--border-color);
  flex-shrink: 0;
  user-select: none;
}
.rt-top,
.rt-bottom {
  display: flex;
  flex-direction: column;
}
.rt-item {
  width: 48px;
  height: 48px;
  color: #858585;
  border-radius: 0;
}
.rt-item:hover {
  color: var(--text-primary);
}
.rt-item.active {
  color: var(--text-primary);
  border-right: 2px solid var(--text-primary);
}
</style>
