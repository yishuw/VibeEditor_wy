<template>
  <MainLayout />
</template>

<script setup lang="ts">
import MainLayout from './components/layout/MainLayout.vue';
</script>

<style>
:root {
  --bg-primary: #1e1e1e;
  --bg-secondary: #252526;
  --bg-tertiary: #2d2d30;
  --bg-hover: #3e3e42;
  --border-color: #3e3e42;
  --text-primary: #cccccc;
  --text-secondary: #969696;
  --accent-color: #007acc;
  --accent-hover: #1a8ad4;
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
  background: #424242;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
::-webkit-scrollbar-track {
  background: transparent;
}
</style>
