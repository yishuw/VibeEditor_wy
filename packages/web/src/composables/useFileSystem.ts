import { ref, onMounted, onUnmounted } from 'vue';
import { createFileServiceClient } from '../services/fileService';
import { useEditorStore } from '../stores/editor';

export function useFileSystem() {
  const client = createFileServiceClient();
  const store = useEditorStore();
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function loadDirectory(dirPath: string = '.') {
    isLoading.value = true;
    error.value = null;
    try {
      const entries = await client.readDir(dirPath);
      store.fileTreeNodes = entries;
      return entries;
    } catch (e: any) {
      error.value = e.message;
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  async function openAndReadFile(filePath: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const content = await client.readFile(filePath);
      store.openFile(filePath, content);
    } catch (e: any) {
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }

  async function saveCurrentFile() {
    const tab = store.activeTab;
    if (!tab || tab.isUntitled) return;
    error.value = null;
    try {
      await client.writeFile(tab.path, tab.content);
      store.saveTab(tab.id);
    } catch (e: any) {
      error.value = e.message;
    }
  }

  async function openFolderDialog() {
    try {
      const root = await client.openFolder();
      if (root) {
        store.workspaceRoot = root;
        await loadDirectory('.');
      }
    } catch (e: any) {
      error.value = e.message;
    }
  }

  async function openFileDialog() {
    try {
      const result = await client.openFile();
      if (result) {
        store.openFile(result.path, result.content);
      }
    } catch (e: any) {
      error.value = e.message;
    }
  }

  const handleKeydown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveCurrentFile();
    }
  };

  onMounted(() => window.addEventListener('keydown', handleKeydown));
  onUnmounted(() => window.removeEventListener('keydown', handleKeydown));

  return {
    client, isLoading, error,
    loadDirectory, openAndReadFile, saveCurrentFile,
    openFolderDialog, openFileDialog,
  };
}
