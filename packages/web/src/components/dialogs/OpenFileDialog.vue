<template>
  <div class="dialog-overlay" @click.self="$emit('cancel')">
    <div class="dialog open-file-dialog">
      <h3 class="dialog-title">{{ $t('openDialog.selectFile') }}</h3>

      <div class="dialog-toolbar">
        <button class="toolbar-btn" :disabled="!selectedDir" @click="startNewFolder">
          📁+ {{ $t('openDialog.newFolder') }}
        </button>
        <button class="toolbar-btn" :disabled="!selectedDir" @click="goToParent">
          ⬆ {{ $t('openDialog.goParent') }}
        </button>
      </div>

      <div class="dialog-dir-list" ref="listRef">
        <div v-if="loadingRoots" class="dialog-empty">{{ $t('openDialog.loading') }}</div>
        <template v-for="node in flatTree" :key="node.path">
          <div
            class="dialog-entry"
            :class="{ selected: selectedPath === node.path && !node.isDirectory, 'dir-selected': selectedDir === node.path && node.isDirectory }"
            :style="{ paddingLeft: node.depth * 16 + 10 + 'px' }"
            @click="handleClick(node)"
          >
            <span class="entry-arrow" :class="{ expanded: node.expanded }" v-if="node.isDirectory">
              {{ node.expanded ? '▾' : '▸' }}
            </span>
            <span class="entry-arrow" v-else></span>
            <span class="entry-icon">{{ node.isDirectory ? (node.expanded ? '📂' : '📁') : '📄' }}</span>
            <span class="entry-name">{{ node.name }}</span>
          </div>
        </template>
        <div v-if="!loadingRoots && flatTree.length === 0" class="dialog-empty">
          {{ $t('openDialog.empty') }}
        </div>
      </div>

      <div class="dialog-selected" v-if="selectedPath">
        {{ $t('openDialog.selectedFile') }}: <strong>{{ selectedName }}</strong>
      </div>

      <div class="dialog-actions">
        <button class="dialog-btn dialog-btn-cancel" @click="$emit('cancel')">{{ $t('openDialog.cancel') }}</button>
        <button class="dialog-btn dialog-btn-confirm" :disabled="!selectedPath" @click="confirm">
          {{ $t('openDialog.open') }}
        </button>
      </div>
    </div>

    <!-- 新建文件夹浮动对话框 -->
    <div v-if="showNewFolderDialog" class="new-folder-overlay" @click.self="cancelNewFolder">
      <div class="new-folder-dialog">
        <h4 class="nf-title">{{ $t('openDialog.newFolderTitle') }}</h4>
        <div class="nf-context">{{ $t('openDialog.selected') }}: {{ creatingParent }}</div>
        <input
          ref="nfInput"
          v-model="newFolderName"
          class="nf-input"
          :placeholder="$t('openDialog.folderName')"
          :class="{ 'nf-input-error': newFolderError }"
          @keyup.enter="confirmNewFolder"
          @keyup.escape="cancelNewFolder"
          @input="newFolderError = ''"
        />
        <div v-if="newFolderError" class="nf-error">{{ newFolderError }}</div>
        <div class="nf-actions">
          <button class="nf-btn nf-btn-cancel" @click="cancelNewFolder">{{ $t('openDialog.cancel') }}</button>
          <button class="nf-btn nf-btn-confirm" :disabled="!newFolderName.trim()" @click="confirmNewFolder">
            {{ $t('openDialog.create') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const emit = defineEmits<{
  confirm: [filePath: string];
  cancel: [];
}>();

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  depth: number;
  expanded: boolean;
  loaded: boolean;
  loading: boolean;
  parent: string | null;
}

const nodes = ref<TreeNode[]>([]);
const selectedPath = ref('');
const selectedDir = ref('');
const loadingRoots = ref(false);

const showNewFolderDialog = ref(false);
const newFolderName = ref('');
const newFolderError = ref('');
const creatingParent = ref('');
const nfInput = ref<HTMLInputElement | null>(null);

const selectedName = computed(() => selectedPath.value.split('/').pop() || selectedPath.value.split('\\').pop() || '');

const flatTree = computed(() => {
  const result: TreeNode[] = [];
  function walk(list: TreeNode[]) {
    for (const n of list) {
      result.push(n);
      if (n.expanded && n.loaded) {
        const children = nodes.value.filter(c => c.parent === n.path);
        walk(children);
      }
    }
  }
  walk(nodes.value.filter(n => n.parent === null));
  return result;
});

function getParentPath(targetPath: string): string | null {
  const node = nodes.value.find(n => n.path === targetPath);
  return node?.parent || null;
}

async function handleClick(node: TreeNode) {
  if (node.isDirectory) {
    selectedDir.value = node.path;
    if (node.expanded) {
      node.expanded = false;
      return;
    }
    node.expanded = true;

    if (!node.loaded) {
      node.loading = true;
      try {
        const resp = await fetch(`/api/workspace/browse?path=${encodeURIComponent(node.path)}`);
        if (!resp.ok) throw new Error('Browse failed');
        const data = await resp.json();
        const entries: any[] = data.entries;
        entries.sort((a: any, b: any) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        for (const entry of entries) {
          nodes.value.push({
            name: entry.name,
            path: entry.path,
            isDirectory: entry.isDirectory,
            depth: node.depth + 1,
            expanded: false,
            loaded: false,
            loading: false,
            parent: node.path,
          });
        }
        node.loaded = true;
      } catch { /* ignore */ }
      node.loading = false;
    }
  } else {
    selectedPath.value = node.path;
  }
}

function goToParent() {
  const parent = getParentPath(selectedDir.value);
  if (parent) {
    selectedDir.value = parent;
  }
}

const INVALID_CHARS = /[<>:"/\\|?*]/;

function startNewFolder() {
  const targetNode = nodes.value.find(n => n.path === selectedDir.value && n.isDirectory);
  if (!targetNode) return;

  creatingParent.value = targetNode.path;
  newFolderName.value = '';
  newFolderError.value = '';
  showNewFolderDialog.value = true;
  nextTick(() => nfInput.value?.focus());
}

async function confirmNewFolder() {
  const name = newFolderName.value.trim();
  if (!name) {
    newFolderError.value = t('openDialog.emptyFolderName');
    return;
  }
  if (INVALID_CHARS.test(name)) {
    newFolderError.value = t('openDialog.invalidFolderName');
    return;
  }

  const fullPath = creatingParent.value.replace(/\/$/, '') + '/' + name;
  try {
    const resp = await fetch('/api/files/mkdir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: name, root: creatingParent.value }),
    });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new Error((data as any).error || `HTTP ${resp.status}`);
    }

    const parentNode = nodes.value.find(n => n.path === creatingParent.value);
    if (parentNode) {
      removeChildren(parentNode.path);
      parentNode.loaded = false;
      parentNode.expanded = false;
      await handleClick(parentNode);
    }
    showNewFolderDialog.value = false;
    await nextTick();
    scrollToSelected();
  } catch (e: any) {
    newFolderError.value = e.message || t('openDialog.newFolderError');
  }
}

function cancelNewFolder() {
  showNewFolderDialog.value = false;
  newFolderName.value = '';
  newFolderError.value = '';
}

function scrollToSelected() {
  const el = listRef.value?.querySelector('.dialog-entry.dir-selected') as HTMLElement | null;
  el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function removeChildren(parentPath: string) {
  const toRemove = new Set<string>();
  function collect(p: string) {
    const children = nodes.value.filter(n => n.parent === p);
    for (const c of children) {
      toRemove.add(c.path);
      collect(c.path);
    }
  }
  collect(parentPath);
  nodes.value = nodes.value.filter(n => !toRemove.has(n.path));
}

async function loadRoots() {
  loadingRoots.value = true;
  try {
    const resp = await fetch('/api/workspace/roots');
    if (!resp.ok) throw new Error('Failed');
    const data = await resp.json();
    const roots: TreeNode[] = [];
    for (const root of data) {
      roots.push({
        name: root.path === '/' ? '/' : root.path,
        path: root.path,
        isDirectory: true,
        depth: 0,
        expanded: false,
        loaded: false,
        loading: false,
        parent: null,
      });
    }
    if (roots.length === 1) {
      nodes.value = roots;
      handleClick(roots[0]);
    } else {
      nodes.value = roots;
    }
  } catch { /* ignore */ }
  loadingRoots.value = false;
}

function confirm() {
  if (selectedPath.value) {
    emit('confirm', selectedPath.value);
  }
}

onMounted(() => {
  loadRoots();
});
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--bg-primary, #1e1e1e);
  border: 1px solid var(--border-color, #333);
  border-radius: 8px;
  padding: 20px;
  min-width: 520px;
  max-width: 640px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  user-select: none;
}

.dialog-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #ccc);
}

.dialog-toolbar {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.toolbar-btn {
  padding: 4px 10px;
  background: var(--bg-secondary, #333);
  color: var(--text-primary, #ccc);
  border: 1px solid var(--border-color, #444);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.toolbar-btn:hover {
  background: var(--bg-hover, #3a3d3e);
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.dialog-dir-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid var(--border-color, #333);
  border-radius: 4px;
  min-height: 280px;
  max-height: 420px;
}

.dialog-entry {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary, #ccc);
  white-space: nowrap;
}

.dialog-entry:hover {
  background: var(--bg-hover, #2a2d2e);
}

.dialog-entry.selected {
  background: var(--accent-bg, #094771);
}

.dialog-entry.dir-selected {
  background: rgba(79, 193, 255, 0.08);
}

.entry-arrow {
  width: 14px;
  font-size: 11px;
  color: var(--text-secondary, #888);
  flex-shrink: 0;
  text-align: center;
}

.entry-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.entry-name {
  pointer-events: none;
}

.dialog-empty {
  padding: 20px;
  text-align: center;
  color: var(--text-secondary, #666);
  font-size: 13px;
}

.dialog-selected {
  margin-top: 10px;
  padding: 6px 10px;
  background: var(--bg-secondary, #252525);
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-secondary, #999);
  word-break: break-all;
}

.dialog-selected strong {
  color: var(--accent, #4fc1ff);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.dialog-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.dialog-btn-cancel {
  background: var(--bg-secondary, #333);
  color: var(--text-primary, #ccc);
}

.dialog-btn-confirm {
  background: var(--accent, #0078d4);
  color: #fff;
}

.dialog-btn-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 新建文件夹浮动对话框 */
.new-folder-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.new-folder-dialog {
  background: var(--bg-primary, #1e1e1e);
  border: 1px solid var(--border-color, #444);
  border-radius: 8px;
  padding: 20px;
  min-width: 380px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.nf-title {
  margin: 0 0 8px 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #ccc);
}

.nf-context {
  font-size: 11px;
  color: var(--text-secondary, #888);
  margin-bottom: 12px;
  word-break: break-all;
}

.nf-input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  background: var(--bg-secondary, #252525);
  border: 1px solid var(--border-color, #444);
  border-radius: 4px;
  color: var(--text-primary, #ccc);
  font-size: 14px;
  outline: none;
}

.nf-input:focus {
  border-color: var(--accent, #4fc1ff);
}

.nf-input-error {
  border-color: #f44747;
}

.nf-error {
  color: #f44747;
  font-size: 12px;
  margin-top: 6px;
}

.nf-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.nf-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.nf-btn-cancel {
  background: var(--bg-secondary, #333);
  color: var(--text-primary, #ccc);
}

.nf-btn-confirm {
  background: var(--accent, #0078d4);
  color: #fff;
}

.nf-btn-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
