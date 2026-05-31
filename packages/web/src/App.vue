<!--
  根组件 —— 渲染主布局并定义全局 CSS 变量
  遵循 VS Code 暗色主题风格
-->
<template>
  <MainLayout />
</template>

<script setup lang="ts">
import MainLayout from './components/layout/MainLayout.vue';
</script>

<style>
:root[data-theme="dark"] {
  --bg-primary: #1e1e1e;
  --bg-secondary: #252526;
  --bg-tertiary: #2d2d30;
  --bg-hover: #3e3e42;
  --border-color: #3e3e42;
  --text-primary: #cccccc;
  --text-secondary: #969696;
  --accent-color: #007acc;
  --accent-hover: #1a8ad4;
  --statusbar-bg: #007acc;
  --statusbar-text: #fff;
  --scrollbar-thumb: #424242;
  --scrollbar-thumb-hover: #555;
  --agent-msg-assistant-bg: #1a3a5c;
  --agent-msg-system-bg: #5c1a1a;
  --agent-code-bg: #0d1117;
  --agent-code-accent: #e06c75;
  --agent-thinking-title: #d4a017;
  --agent-thinking-text: #b8952e;
  --agent-thinking-surface: rgba(255,200,50,0.05);
  --agent-thinking-border: rgba(255,200,50,0.2);
  --agent-blockquote-bg: rgba(255,255,255,0.03);
  --agent-divider: rgba(255,255,255,0.1);
  --agent-edit-text: #4ec9b0;
  --agent-edit-surface: rgba(0,200,100,0.1);
  --agent-edit-border: rgba(0,200,100,0.3);
  --agent-edit-badge: rgba(0,200,100,0.15);
  --agent-undo-text: #d4a017;
  --agent-undo-surface: rgba(255,200,50,0.15);
  --agent-undo-border: rgba(255,200,50,0.3);
  --agent-item-hover: rgba(255,255,255,0.08);
  --agent-on-accent-text: #fff;
}

:root[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f3f3f3;
  --bg-tertiary: #ececec;
  --bg-hover: #e0e0e0;
  --border-color: #d4d4d4;
  --text-primary: #3b3b3b;
  --text-secondary: #6d6d6d;
  --accent-color: #007acc;
  --accent-hover: #1a8ad4;
  --statusbar-bg: #dadada;
  --statusbar-text: #3b3b3b;
  --scrollbar-thumb: #c8c8c8;
  --scrollbar-thumb-hover: #a8a8a8;
  --agent-msg-assistant-bg: #e8f0fe;
  --agent-msg-system-bg: #fde8e8;
  --agent-code-bg: #f6f8fa;
  --agent-code-accent: #cf222e;
  --agent-thinking-title: #9a7b0b;
  --agent-thinking-text: #7d6608;
  --agent-thinking-surface: rgba(180,140,10,0.05);
  --agent-thinking-border: rgba(180,140,10,0.2);
  --agent-blockquote-bg: rgba(0,0,0,0.04);
  --agent-divider: rgba(0,0,0,0.1);
  --agent-edit-text: #16a34a;
  --agent-edit-surface: rgba(22,163,74,0.1);
  --agent-edit-border: rgba(22,163,74,0.25);
  --agent-edit-badge: rgba(22,163,74,0.12);
  --agent-undo-text: #92400e;
  --agent-undo-surface: rgba(146,64,14,0.1);
  --agent-undo-border: rgba(146,64,14,0.25);
  --agent-item-hover: rgba(0,0,0,0.06);
  --agent-on-accent-text: #fff;
}

:root[data-theme="blue"] {
  --bg-primary: #002451;
  --bg-secondary: #001b3d;
  --bg-tertiary: #001733;
  --bg-hover: #00346e;
  --border-color: #1f4662;
  --text-primary: #ffffff;
  --text-secondary: #7285b7;
  --accent-color: #007acc;
  --accent-hover: #1a8ad4;
  --statusbar-bg: #007acc;
  --statusbar-text: #fff;
  --scrollbar-thumb: #1f4662;
  --scrollbar-thumb-hover: #2d6194;
  --agent-msg-assistant-bg: #1a3a5c;
  --agent-msg-system-bg: #5c1a1a;
  --agent-code-bg: #0d1117;
  --agent-code-accent: #e06c75;
  --agent-thinking-title: #d4a017;
  --agent-thinking-text: #b8952e;
  --agent-thinking-surface: rgba(255,200,50,0.05);
  --agent-thinking-border: rgba(255,200,50,0.2);
  --agent-blockquote-bg: rgba(255,255,255,0.03);
  --agent-divider: rgba(255,255,255,0.1);
  --agent-edit-text: #4ec9b0;
  --agent-edit-surface: rgba(0,200,100,0.1);
  --agent-edit-border: rgba(0,200,100,0.3);
  --agent-edit-badge: rgba(0,200,100,0.15);
  --agent-undo-text: #d4a017;
  --agent-undo-surface: rgba(255,200,50,0.15);
  --agent-undo-border: rgba(255,200,50,0.3);
  --agent-item-hover: rgba(255,255,255,0.08);
  --agent-on-accent-text: #fff;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
}
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}
::-webkit-scrollbar-track {
  background: transparent;
}
</style>
