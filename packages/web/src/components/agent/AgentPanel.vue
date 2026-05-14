<template>
  <div class="agent-panel">
    <!-- 提供商选择 + 设置按钮 -->
    <div class="agent-header">
      <div class="header-left">
        <select
          class="provider-select"
          :value="providerSettings.activeId.value"
          @change="providerSettings.setActive(($event.target as HTMLSelectElement).value)"
        >
          <option
            v-for="p in providerSettings.providers.value"
            :key="p.id"
            :value="p.id"
          >
            {{ p.name }} ({{ p.model }})
          </option>
        </select>
        <button class="settings-btn" title="提供商设置" @click="showSettings = true">&#9881;</button>
      </div>
      <div class="agent-mode-selector">
        <button
          v-for="mode in modes"
          :key="mode"
          class="mode-btn"
          :class="{ active: agent.config.value.mode === mode }"
          @click="agent.setMode(mode)"
        >
          {{ mode }}
        </button>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="agent-messages" ref="messagesContainer">
      <div v-if="agent.messages.value.length === 0" class="agent-empty">
        Ask the agent to help with editing
      </div>
      <div
        v-for="msg in agent.messages.value"
        :key="msg.id"
        class="agent-message"
        :class="'msg-' + msg.role"
      >
        <div class="msg-role">{{ msg.role }}</div>
        <div class="msg-content">{{ msg.content }}</div>
      </div>
      <div v-if="agent.isProcessing.value" class="agent-loading">Thinking...</div>
    </div>

    <!-- 输入区域 -->
    <div class="agent-input-area">
      <textarea
        v-model="input"
        class="agent-input"
        placeholder="Ask the agent..."
        rows="2"
        @keydown.enter.exact.prevent="send"
      ></textarea>
      <button class="agent-send-btn" @click="send" :disabled="!input.trim() || agent.isProcessing.value">
        Send
      </button>
    </div>

    <!-- 设置对话框 -->
    <SettingsDialog :visible="showSettings" @close="showSettings = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useAgent } from '../../composables/useAgent';
import { useProviderSettings } from '../../composables/useProviderSettings';
import SettingsDialog from './SettingsDialog.vue';

const agent = useAgent();
const providerSettings = useProviderSettings();
const input = ref('');
const messagesContainer = ref<HTMLElement>();
const modes = ['chat', 'edit', 'agent'] as const;
const showSettings = ref(false);

async function send() {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  // 传递当前激活的提供商配置，包含 apiUrl、apiKey、model
  await agent.streamMessage(text, providerSettings.activeProvider.value);
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}
</script>

<style scoped>
.agent-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
}
.agent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border-color);
  gap: 8px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.provider-select {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 3px 6px;
  font-size: 11px;
  border-radius: 3px;
  cursor: pointer;
  max-width: 160px;
  font-family: inherit;
}
.provider-select:focus {
  outline: none;
  border-color: var(--accent-color);
}
.settings-btn {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 3px;
  line-height: 1;
  flex-shrink: 0;
}
.settings-btn:hover {
  color: var(--text-primary);
  border-color: var(--accent-color);
}
.agent-mode-selector {
  display: flex;
  gap: 2px;
}
.mode-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 2px 8px;
  font-size: 11px;
  cursor: pointer;
  border-radius: 3px;
}
.mode-btn.active {
  background: var(--accent-color);
  color: #fff;
  border-color: var(--accent-color);
}
.agent-messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.agent-empty {
  color: var(--text-secondary);
  font-size: 13px;
  text-align: center;
  padding: 40px 0;
}
.agent-message {
  margin-bottom: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 13px;
}
.msg-user {
  background: var(--bg-tertiary);
}
.msg-assistant {
  background: #1a3a5c;
}
.msg-system {
  background: #5c1a1a;
}
.msg-role {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.msg-content {
  white-space: pre-wrap;
  word-break: break-word;
}
.agent-loading {
  color: var(--accent-color);
  font-size: 12px;
  padding: 4px 8px;
}
.agent-input-area {
  display: flex;
  gap: 6px;
  padding: 8px;
  border-top: 1px solid var(--border-color);
}
.agent-input {
  flex: 1;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 6px 8px;
  font-size: 13px;
  resize: none;
  border-radius: 4px;
  font-family: inherit;
}
.agent-input:focus {
  outline: none;
  border-color: var(--accent-color);
}
.agent-send-btn {
  background: var(--accent-color);
  border: none;
  color: #fff;
  padding: 6px 14px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  align-self: flex-end;
}
.agent-send-btn:hover {
  background: var(--accent-hover);
}
.agent-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
