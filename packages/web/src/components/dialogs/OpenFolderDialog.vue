<template>
  <n-modal
    v-model:show="showModal"
    preset="card"
    :title="$t('openDialog.selectFolder')"
    style="width: 560px; max-height: 80vh"
    @after-leave="$emit('cancel')"
  >
    <div class="dialog-toolbar">
      <n-button size="small" :disabled="!selectedPath" @click="startNewFolder">
        <template #icon><n-icon :component="CreateOutline" /></template>
        {{ $t('openDialog.newFolder') }}
      </n-button>
      <n-button size="small" :disabled="!selectedPath" @click="goToParent">
        <template #icon><n-icon :component="ArrowUpOutline" /></template>
        {{ $t('openDialog.goParent') }}
      </n-button>
    </div>

    <div class="dialog-dir-list" ref="listRef">
      <n-spin v-if="loadingRoots" size="small" class="dialog-empty" />
      <template v-for="node in flatTree" :key="node.path">
        <div
          class="dialog-entry"
          :class="{ selected: selectedPath === node.path }"
          :style="{ paddingLeft: node.depth * 16 + 10 + 'px' }"
          @click="handleClick(node)"
        >
          <span class="entry-arrow" :class="{ expanded: node.expanded }" v-if="node.isDirectory">
            {{ node.expanded ? '▾' : '▸' }}
          </span>
          <span class="entry-arrow" v-else></span>
          <n-icon size="16" :component="node.isDirectory ? (node.expanded ? FolderOpenOutline : FolderOutline) : DocumentOutline" />
          <span class="entry-name">{{ node.name }}</span>
        </div>
      </template>
      <n-empty v-if="!loadingRoots && flatTree.length === 0" :description="$t('openDialog.empty')" size="small" class="dialog-empty" />
    </div>

    <div class="dialog-selected" v-if="selectedPath">
      {{ $t('openDialog.selected') }}: <strong>{{ selectedPath }}</strong>
    </div>

    <template #footer>
      <n-button @click="$emit('cancel')">{{ $t('openDialog.cancel') }}</n-button>
      <n-button type="primary" :disabled="!selectedPath" @click="confirm">
        {{ $t('openDialog.open') }}
      </n-button>
    </template>
  </n-modal>

  <!-- 新建文件夹 -->
  <n-modal
    v-model:show="showNewFolderDialog"
    preset="card"
    :title="$t('openDialog.newFolderTitle')"
    style="width: 400px"
  >
    <n-text depth="3">{{ $t('openDialog.selected') }}: {{ creatingParent }}</n-text>
    <n-input
      ref="nfInput"
      v-model:value="newFolderName"
      :placeholder="$t('openDialog.folderName')"
      :status="newFolderError ? 'error' : undefined"
      @keyup.enter="confirmNewFolder"
      @keyup.escape="cancelNewFolder"
      @input="newFolderError = ''"
    />
    <div v-if="newFolderError" class="nf-error">{{ newFolderError }}</div>
    <template #footer>
      <n-button @click="cancelNewFolder">{{ $t('openDialog.cancel') }}</n-button>
      <n-button type="primary" :disabled="!newFolderName.trim()" @click="confirmNewFolder">
        {{ $t('openDialog.create') }}
      </n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { NModal, NButton, NInput, NIcon, NSpin, NText, NEmpty } from 'naive-ui'
import { CreateOutline, ArrowUpOutline, FolderOutline, FolderOpenOutline, DocumentOutline } from '@vicons/ionicons5'

const { t } = useI18n()

const emit = defineEmits<{
  confirm: [rootPath: string]
  cancel: []
}>()

interface TreeNode {
  name: string; path: string; isDirectory: boolean
  depth: number; expanded: boolean; loaded: boolean; loading: boolean
  parent: string | null
}

const showModal = ref(true)
const nodes = ref<TreeNode[]>([])
const selectedPath = ref('')
const loadingRoots = ref(false)
const listRef = ref<HTMLElement>()

const showNewFolderDialog = ref(false)
const newFolderName = ref('')
const newFolderError = ref('')
const creatingParent = ref('')
const nfInput = ref<{ focus: () => void }>()

const flatTree = computed(() => {
  const result: TreeNode[] = []
  function walk(list: TreeNode[]) {
    for (const n of list) {
      result.push(n)
      if (n.expanded && n.loaded) {
        const children = nodes.value.filter(c => c.parent === n.path)
        walk(children)
      }
    }
  }
  walk(nodes.value.filter(n => n.parent === null))
  return result
})

function getParentPath(targetPath: string): string | null {
  const node = nodes.value.find(n => n.path === targetPath)
  return node?.parent || null
}

async function handleClick(node: TreeNode) {
  if (!node.isDirectory) return
  if (node.expanded) { node.expanded = false; return }
  node.expanded = true
  selectedPath.value = node.path
  if (!node.loaded) {
    node.loading = true
    try {
      const resp = await fetch(`/api/workspace/browse?path=${encodeURIComponent(node.path)}`)
      if (!resp.ok) throw new Error('Browse failed')
      const data = await resp.json()
      const dirs = (data.entries as any[]).filter((e: any) => e.isDirectory)
      for (const entry of dirs) {
        nodes.value.push({
          name: entry.name, path: entry.path, isDirectory: true,
          depth: node.depth + 1, expanded: false, loaded: false,
          loading: false, parent: node.path,
        })
      }
      node.loaded = true
    } catch { /* ignore */ }
    node.loading = false
  }
}

function goToParent() {
  const parent = getParentPath(selectedPath.value)
  if (parent) selectedPath.value = parent
}

const INVALID_CHARS = /[<>:"/\\|?*]/

function startNewFolder() {
  const targetNode = nodes.value.find(n => n.path === selectedPath.value && n.isDirectory)
  if (!targetNode) return
  creatingParent.value = targetNode.path
  newFolderName.value = ''
  newFolderError.value = ''
  showNewFolderDialog.value = true
  nextTick(() => nfInput.value?.focus())
}

async function confirmNewFolder() {
  const name = newFolderName.value.trim()
  if (!name) { newFolderError.value = t('openDialog.emptyFolderName'); return }
  if (INVALID_CHARS.test(name)) { newFolderError.value = t('openDialog.invalidFolderName'); return }

  const fullPath = creatingParent.value.replace(/\/$/, '') + '/' + name
  try {
    const resp = await fetch('/api/files/mkdir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: name, root: creatingParent.value }),
    })
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}))
      throw new Error((data as any).error || `HTTP ${resp.status}`)
    }
    const parentNode = nodes.value.find(n => n.path === creatingParent.value)
    if (parentNode) { removeChildren(parentNode.path); parentNode.loaded = false; parentNode.expanded = false; await handleClick(parentNode) }
    selectedPath.value = fullPath
    showNewFolderDialog.value = false
    await nextTick()
    scrollToSelected()
  } catch (e: any) {
    newFolderError.value = e.message || t('openDialog.newFolderError')
  }
}

function cancelNewFolder() {
  showNewFolderDialog.value = false
  newFolderName.value = ''
  newFolderError.value = ''
}

function scrollToSelected() {
  const el = listRef.value?.querySelector('.dialog-entry.selected') as HTMLElement | null
  el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

function removeChildren(parentPath: string) {
  const toRemove = new Set<string>()
  function collect(p: string) {
    const children = nodes.value.filter(n => n.parent === p)
    for (const c of children) { toRemove.add(c.path); collect(c.path) }
  }
  collect(parentPath)
  nodes.value = nodes.value.filter(n => !toRemove.has(n.path))
}

async function loadRoots() {
  loadingRoots.value = true
  try {
    const resp = await fetch('/api/workspace/roots')
    if (!resp.ok) throw new Error('Failed')
    const data = await resp.json()
    const roots: TreeNode[] = []
    for (const root of data) {
      roots.push({ name: root.path === '/' ? '/' : root.path, path: root.path, isDirectory: true, depth: 0, expanded: false, loaded: false, loading: false, parent: null })
    }
    nodes.value = roots
    if (roots.length === 1) handleClick(roots[0])
  } catch { /* ignore */ }
  loadingRoots.value = false
}

function confirm() {
  if (selectedPath.value) emit('confirm', selectedPath.value)
}

onMounted(() => { loadRoots() })
</script>

<style scoped>
.dialog-toolbar {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}
.dialog-dir-list {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  min-height: 280px;
  max-height: 420px;
  overflow-y: auto;
}
.dialog-entry {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
}
.dialog-entry:hover { background: var(--bg-hover); }
.dialog-entry.selected { background: rgba(0, 122, 204, 0.15); }
.entry-arrow { width: 14px; font-size: 11px; color: var(--text-secondary); flex-shrink: 0; text-align: center; }
.entry-name { pointer-events: none; }
.dialog-empty { padding: 20px; text-align: center; }
.dialog-selected {
  margin-top: 10px;
  padding: 6px 10px;
  background: var(--bg-secondary);
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  word-break: break-all;
}
.dialog-selected strong { color: var(--accent-color); }
.nf-error { color: #f44747; font-size: 12px; margin-top: 6px; }
</style>
