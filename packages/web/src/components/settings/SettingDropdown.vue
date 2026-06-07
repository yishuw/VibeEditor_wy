<template>
  <n-dropdown trigger="click" :options="settingsOptions" @select="handleSelect" placement="top-end">
    <n-button quaternary class="setting-gear" :title="$t('activityBar.manage')">
      <template #icon>
        <n-icon size="22" :component="SettingsOutline" />
      </template>
    </n-button>
  </n-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NIcon, NDropdown } from 'naive-ui'
import { SettingsOutline } from '@vicons/ionicons5'
import { useSettingsStore } from '../../stores/settings'
import type { Language, Theme } from '../../stores/settings'

const settings = useSettingsStore()
const { t } = useI18n()

const settingsOptions = computed(() => [
  {
    label: t('settings.language'),
    key: 'lang-menu',
    children: [
      { label: 'English', key: 'lang:en' },
      { label: '中文', key: 'lang:zh' },
    ],
  },
  {
    label: t('settings.theme'),
    key: 'theme-menu',
    children: [
      { label: t('theme.dark'), key: 'theme:dark' },
      { label: t('theme.light'), key: 'theme:light' },
      { label: t('theme.blue'), key: 'theme:blue' },
    ],
  },
])

function handleSelect(key: string) {
  if (key === 'lang:en') settings.setLanguage('en')
  else if (key === 'lang:zh') settings.setLanguage('zh')
  else if (key === 'theme:dark') settings.setTheme('dark')
  else if (key === 'theme:light') settings.setTheme('light')
  else if (key === 'theme:blue') settings.setTheme('blue')
}
</script>

<style scoped>
.setting-gear {
  width: 48px;
  height: 48px;
  color: #858585;
  border-radius: 0;
}
.setting-gear:hover {
  color: var(--text-primary);
}
</style>
