import { ref } from 'vue';
import { createAgentService } from '../services/agentService';
import type { AgentConfig } from '../services/agentService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export function useAgent() {
  const messages = ref<ChatMessage[]>([]);
  const isProcessing = ref(false);
  const config = ref<AgentConfig>({ mode: 'chat' });
  const service = createAgentService();

  async function sendMessage(content: string) {
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    messages.value.push(userMsg);
    isProcessing.value = true;

    try {
      const response = await service.sendMessage(content, {
        openFiles: [],
        conversationHistory: messages.value.slice(0, -1),
      }, config.value);

      messages.value.push(response);
    } catch (e: any) {
      messages.value.push({
        id: `msg_err_${Date.now()}`,
        role: 'system',
        content: `Error: ${e.message}`,
        timestamp: Date.now(),
      });
    } finally {
      isProcessing.value = false;
    }
  }

  function clearMessages() {
    messages.value = [];
  }

  function setMode(mode: AgentConfig['mode']) {
    config.value.mode = mode;
  }

  return { messages, isProcessing, config, sendMessage, clearMessages, setMode };
}
