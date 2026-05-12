<template>
  <div ref="editorContainer" class="monaco-editor-wrapper"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as monaco from 'monaco-editor';

const props = defineProps<{
  content: string;
  language: string;
  readOnly?: boolean;
}>();

const emit = defineEmits<{
  'content-change': [content: string];
  'editor-ready': [editor: monaco.editor.IStandaloneCodeEditor];
}>();

const editorContainer = ref<HTMLElement>();
let editor: monaco.editor.IStandaloneCodeEditor | null = null;

onMounted(() => {
  if (!editorContainer.value) return;

  editor = monaco.editor.create(editorContainer.value, {
    value: props.content,
    language: props.language,
    readOnly: props.readOnly ?? false,
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: true },
    fontSize: 14,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    wordWrap: 'off',
    tabSize: 2,
    renderWhitespace: 'selection',
    bracketPairColorization: { enabled: true },
    guides: { bracketPairs: true },
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
  });

  editor.onDidChangeModelContent(() => {
    emit('content-change', editor!.getValue());
  });

  emit('editor-ready', editor);
});

watch(() => props.language, (lang) => {
  if (editor) {
    const model = editor.getModel();
    if (model) monaco.editor.setModelLanguage(model, lang);
  }
});

watch(() => props.content, (val) => {
  if (editor && val !== editor.getValue()) {
    editor.setValue(val);
  }
});

onBeforeUnmount(() => {
  editor?.dispose();
});
</script>

<style scoped>
.monaco-editor-wrapper {
  width: 100%;
  height: 100%;
}
</style>
