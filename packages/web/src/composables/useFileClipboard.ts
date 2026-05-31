import { ref } from 'vue';

export interface ClipboardData {
  action: 'cut' | 'copy';
  path: string;
  isDirectory: boolean;
  name: string;
}

export function useFileClipboard() {
  const clipboard = ref<ClipboardData | null>(null);

  function cutItem(path: string, isDirectory: boolean, name: string) {
    clipboard.value = { action: 'cut', path, isDirectory, name };
  }

  function copyItem(path: string, isDirectory: boolean, name: string) {
    clipboard.value = { action: 'copy', path, isDirectory, name };
  }

  async function copyPathToClipboard(path: string) {
    try {
      await navigator.clipboard.writeText(path);
    } catch {
      // 剪贴板不可用
    }
  }

  async function copyDirRecursive(
    srcClient: { readDir: (p: string) => Promise<any[]>; readFile: (p: string) => Promise<string> },
    targetClient: { createDir: (p: string) => Promise<void>; writeFile: (p: string, c: string) => Promise<void> },
    srcPath: string,
    targetPath: string,
  ) {
    await targetClient.createDir(targetPath);
    const entries = await srcClient.readDir(srcPath);
    for (const entry of entries) {
      const childSrc = srcPath + '/' + entry.path;
      const childTarget = targetPath + '/' + entry.path;
      if (entry.isDirectory) {
        await copyDirRecursive(srcClient, targetClient, childSrc, childTarget);
      } else {
        const content = await srcClient.readFile(childSrc);
        await targetClient.writeFile(childTarget, content);
      }
    }
  }

  return { clipboard, cutItem, copyItem, copyPathToClipboard, copyDirRecursive };
}
