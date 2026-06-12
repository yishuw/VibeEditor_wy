import { computed } from 'vue'
import { darkTheme, lightTheme } from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'
import { useSettingsStore } from '../stores/settings'

const blueThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#007acc',
    primaryColorHover: '#1a8ad4',
    primaryColorPressed: '#005a9e',
    primaryColorSuppl: '#00346e',
    bodyColor: '#002451',
    cardColor: '#001b3d',
    modalColor: '#001b3d',
    popoverColor: '#001b3d',
    inputColor: '#001733',
    borderColor: '#1f4662',
    textColor1: '#ffffff',
    textColor2: '#7285b7',
    textColor3: '#4a5f8e',
    borderRadius: '4px',
    fontSize: '14px',
    scrollbarColor: '#1f4662',
    scrollbarColorHover: '#2d6194',
  },
}

export function useNaiveTheme() {
  const settings = useSettingsStore()

  const naiveTheme = computed(() =>
    settings.theme === 'dark' ? darkTheme : lightTheme
  )

  const themeOverrides = computed(() =>
    settings.theme === 'blue' ? blueThemeOverrides : undefined
  )

  return { naiveTheme, themeOverrides }
}
