<template>
  <div class="mcp-panel">
    <div class="mcp-header">
      <span class="mcp-title">{{ $t('mcp.title') }}</span>
    </div>
    <div class="mcp-body">
      <div class="mcp-placeholder">
        <span class="mcp-placeholder-icon">🔌</span>
        <p class="mcp-placeholder-text">{{ $t('mcp.placeholder') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped>
.mcp-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.mcp-header {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}
.mcp-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}
.mcp-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.mcp-placeholder {
  text-align: center;
}
.mcp-placeholder-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
  opacity: 0.4;
}
.mcp-placeholder-text {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
}
</style>
