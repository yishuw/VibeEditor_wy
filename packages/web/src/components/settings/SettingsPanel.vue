<template>
  <div class="settings-panel">
    <div v-if="section === 'language'" class="sp-item">
      <span class="sp-label">{{ $t('settings.language') }}</span>
      <select
        class="sp-select"
        :value="settings.language"
        @change="onLanguageChange"
      >
        <option value="en">English</option>
        <option value="zh">中文</option>
      </select>
    </div>
    <div v-else-if="section === 'appearance'" class="sp-item">
      <span class="sp-label">{{ $t('settings.theme') }}</span>
      <select
        class="sp-select"
        :value="settings.theme"
        @change="onThemeChange"
      >
        <option value="dark">{{ $t('theme.dark') }}</option>
        <option value="light">{{ $t('theme.light') }}</option>
        <option value="blue">{{ $t('theme.blue') }}</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from '../../stores/settings';
import type { Language, Theme } from '../../stores/settings';

defineProps<{
  section: 'language' | 'appearance';
}>();

const settings = useSettingsStore();

function onLanguageChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  settings.setLanguage(target.value as Language);
}

function onThemeChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  settings.setTheme(target.value as Theme);
}
</script>

<style scoped>
.settings-panel {
  padding: 8px 0;
}

.sp-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
}

.sp-label {
  font-size: 13px;
  color: var(--text-primary);
}

.sp-select {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 3px;
  cursor: pointer;
  outline: none;
  min-width: 120px;
}

.sp-select:hover {
  border-color: var(--accent-color);
}

.sp-select:focus {
  border-color: var(--accent-color);
}
</style>
