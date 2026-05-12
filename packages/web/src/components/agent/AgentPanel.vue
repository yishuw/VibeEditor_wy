<template>
  <div class="agent-panel">
    <div class="agent-header">
      <span class="agent-title">AI Agent</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useAgent } from '../../composables/useAgent';

const agent = useAgent();
const input = ref('');
const messagesContainer = ref<HTMLElement>();
const modes = ['chat', 'edit', 'agent'] as const;

async function send() {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  await agent.sendMessage(text);
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
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
}
.agent-title {
  font-size: 13px;
  font-weight: 600;
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
