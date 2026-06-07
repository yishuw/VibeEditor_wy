<template>
  <n-button-group size="small" class="mode-selector">
    <n-button
      :type="modelValue === 'build' ? 'primary' : 'default'"
      @click="$emit('update:modelValue', 'build')"
    >{{ $t('modeSelector.build') }}</n-button>
    <n-button
      :type="modelValue === 'plan' ? 'primary' : 'default'"
      @click="$emit('update:modelValue', 'plan')"
    >{{ $t('modeSelector.plan') }}</n-button>
  </n-button-group>
</template>

<script setup lang="ts">
import { NButtonGroup, NButton } from 'naive-ui'

defineProps<{
  modelValue: 'build' | 'plan'
}>()

defineEmits<{
  'update:modelValue': [value: 'build' | 'plan']
}>()
</script>

<style scoped>
.mode-selector {
  flex-shrink: 0;
}
</style>
