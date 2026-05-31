import ContextMenu from '@imengyu/vue3-context-menu';
import type { MenuItem } from '@imengyu/vue3-context-menu';

export interface ClipboardData {
  action: 'cut' | 'copy';
  path: string;
  isDirectory: boolean;
  name: string;
}

export interface ContextMenuHandlers {
  onOpen: (path: string) => void;
  onRename: (path: string) => void;
  onDelete: (path: string) => void;
  onNewFile: (dirPath: string) => void;
  onNewFolder: (dirPath: string) => void;
  onCut: (path: string, isDirectory: boolean, name: string) => void;
  onCopy: (path: string, isDirectory: boolean, name: string) => void;
  onPaste: (dirPath: string) => void;
  onCopyRelativePath: (path: string) => void;
  onCopyAbsolutePath: (path: string) => void;
  onRefresh: () => void;
}

export function showFileTreeContextMenu(
  type: 'file' | 'folder' | 'root',
  nodePath: string,
  nodeName: string,
  e: MouseEvent,
  handlers: ContextMenuHandlers,
  clipboard: ClipboardData | null,
  t: (key: string) => string,
) {
  e.preventDefault();

  const items: MenuItem[] = [];
  const isFile = type === 'file';
  const isFolder = type === 'folder';
  const isRoot = type === 'root';

  if (isFile) {
    items.push({
      label: t('contextMenu.open'),
      onClick: () => handlers.onOpen(nodePath),
    });
    items.push({ divided: 'self' });
  }

  if (isFolder) {
    items.push({
      label: t('contextMenu.newFile'),
      onClick: () => handlers.onNewFile(nodePath),
    });
    items.push({
      label: t('contextMenu.newFolder'),
      onClick: () => handlers.onNewFolder(nodePath),
    });
    items.push({ divided: 'self' });
  }

  if (isRoot) {
    items.push({
      label: t('contextMenu.newFile'),
      onClick: () => handlers.onNewFile(''),
    });
    items.push({
      label: t('contextMenu.newFolder'),
      onClick: () => handlers.onNewFolder(''),
    });
    items.push({ divided: 'self' });
  }

  if (!isRoot) {
    items.push({
      label: t('contextMenu.cut'),
      shortcut: 'Ctrl+X',
      onClick: () => handlers.onCut(nodePath, isFolder, nodeName),
    });
    items.push({
      label: t('contextMenu.copy'),
      shortcut: 'Ctrl+C',
      onClick: () => handlers.onCopy(nodePath, isFolder, nodeName),
    });
    items.push({
      label: t('contextMenu.copyRelativePath'),
      onClick: () => handlers.onCopyRelativePath(nodePath),
    });
    items.push({
      label: t('contextMenu.copyAbsolutePath'),
      onClick: () => handlers.onCopyAbsolutePath(nodePath),
    });
    items.push({ divided: 'self' });
  }

  if ((isFolder || isRoot) && clipboard) {
    const targetDir = isRoot ? '' : nodePath;
    items.push({
      label: t('contextMenu.paste'),
      shortcut: 'Ctrl+V',
      onClick: () => handlers.onPaste(targetDir),
    });
    items.push({ divided: 'self' });
  }

  if (!isRoot) {
    items.push({
      label: t('contextMenu.rename'),
      onClick: () => handlers.onRename(nodePath),
    });
    items.push({
      label: t('contextMenu.delete'),
      onClick: () => handlers.onDelete(nodePath),
    });
  }

  if (isRoot) {
    items.push({
      label: t('contextMenu.refresh'),
      onClick: () => handlers.onRefresh(),
    });
  }

  ContextMenu.showContextMenu({
    x: e.clientX,
    y: e.clientY,
    items,
    theme: 'mac dark',
    zIndex: 1002,
    minWidth: 180,
  });
}
