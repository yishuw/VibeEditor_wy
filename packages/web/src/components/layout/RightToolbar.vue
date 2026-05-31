<template>
  <div class="right-toolbar">
    <div class="rt-top">
      <div
        v-for="item in items"
        :key="item.id"
        class="rt-item"
        :class="{ active: activeId === item.id }"
        :title="item.label"
        @click="$emit('select', item.id)"
      >
        <span class="rt-icon">{{ item.icon }}</span>
      </div>
    </div>
    <div v-if="bottomItems.length > 0" class="rt-bottom">
      <div
        v-for="item in bottomItems"
        :key="item.id"
        class="rt-item"
        :class="{ active: activeId === item.id }"
        :title="item.label"
        @click="$emit('select', item.id)"
      >
        <span class="rt-icon">{{ item.icon }}</span>
      </div>
    </div>
    <slot name="bottom" />
  </div>
</template>

<script setup lang="ts">
export interface RightToolbarItem {
  id: string;
  label: string;
  icon: string;
}

defineProps<{
  items: RightToolbarItem[];
  bottomItems: RightToolbarItem[];
  activeId: string | null;
}>();

defineEmits<{
  select: [id: string];
}>();
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
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  cursor: pointer;
  color: #858585;
  transition: color 0.1s;
}
.rt-item:hover {
  color: var(--text-primary);
}
.rt-item.active {
  color: var(--text-primary);
}
.rt-item.active::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--text-primary);
}
.rt-icon {
  font-size: 22px;
  line-height: 1;
}
</style>
