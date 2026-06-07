<template>
  <n-select
    class="provider-select"
    :value="activeId"
    :options="selectOptions"
    size="small"
    :placeholder="$t('providerSelect.notSelected')"
    @update:value="(v: string) => $emit('select', v)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NSelect } from 'naive-ui'
import type { ProviderConfig } from '../../composables/useLLMSettings'

const { t } = useI18n()

const props = defineProps<{
  providers: ProviderConfig[]
  activeId: string
}>()

defineEmits<{
  (e: 'select', id: string): void
}>()

const selectOptions = computed(() =>
  props.providers.map(p => ({
    label: `${p.model}  ·  ${p.name}`,
    value: p.id,
  }))
)
</script>

<style scoped>
.provider-select {
  flex: 1;
  min-width: 0;
}
</style>
