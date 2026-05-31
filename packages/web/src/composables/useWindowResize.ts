import { ref } from 'vue';

export type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const EDGE_CURSORS: Record<ResizeEdge, string> = {
  n: 'ns-resize', s: 'ns-resize',
  e: 'ew-resize', w: 'ew-resize',
  ne: 'nesw-resize', nw: 'nwse-resize',
  se: 'nwse-resize', sw: 'nesw-resize',
};

export function useWindowResize() {
  const isResizing = ref(false);

  if (!window.electronAPI) {
    return { startResize: () => {}, isResizing };
  }

  let startBounds: { x: number; y: number; width: number; height: number } | null = null;
  let startMouse = { x: 0, y: 0 };
  let currentEdge: ResizeEdge | null = null;

  async function startResize(edge: ResizeEdge, e: MouseEvent) {
    const api = window.electronAPI!;
    const bounds = await api.getBounds();
    if (!bounds) return;

    startBounds = bounds;
    startMouse = { x: e.screenX, y: e.screenY };
    currentEdge = edge;
    isResizing.value = true;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(e: MouseEvent) {
    if (!startBounds || !currentEdge) return;

    const dx = e.screenX - startMouse.x;
    const dy = e.screenY - startMouse.y;

    let { x, y, width, height } = startBounds;

    if (currentEdge.includes('n')) { y += dy; height -= dy; }
    if (currentEdge.includes('s')) { height += dy; }
    if (currentEdge.includes('w')) { x += dx; width -= dx; }
    if (currentEdge.includes('e')) { width += dx; }

    if (width < 800) {
      if (currentEdge.includes('w')) x = startBounds.x + startBounds.width - 800;
      width = 800;
    }
    if (height < 600) {
      if (currentEdge.includes('n')) y = startBounds.y + startBounds.height - 600;
      height = 600;
    }

    window.electronAPI!.resizeWindow(
      Math.round(x), Math.round(y),
      Math.round(width), Math.round(height),
    );
  }

  function onMouseUp() {
    startBounds = null;
    currentEdge = null;
    isResizing.value = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  return { startResize, isResizing };
}
