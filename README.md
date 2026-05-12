# VibeEditor

AI-powered code editor built with **Monaco Editor** + **Vue 3**, supporting both **server deployment** and **Electron desktop**.

## Architecture

```
VibeEditor/
├── packages/
│   ├── core/           # Shared core: file system abstraction, editor state, agent framework
│   ├── server/         # Express backend: file operations API, agent API
│   ├── web/            # Vue 3 + Vite + Monaco Editor frontend
│   └── electron/       # Electron shell: native file system via IPC
├── package.json        # Root workspace config
├── tsconfig.json       # Project references
└── tsconfig.base.json  # Shared TypeScript config
```

## Quick Start

```bash
# Install dependencies
npm install

# Start server + web frontend simultaneously
npm run dev:all

# Or start individually
npm run dev:server   # Backend on http://localhost:3456
npm run dev:web      # Frontend on http://localhost:5173
```

## Deployment Modes

| Mode | File System | Command |
|------|------------|---------|
| **Electron** desktop | Local FS via IPC (`Node.js fs`) | `npm run dev:electron` |
| **Server** (remote files) | Server FS via REST API | `npm run dev:server` + `npm run dev:web` |
| **Browser** (local files) | File System Access API | `npm run dev:web` |

The frontend auto-detects the runtime environment and selects the appropriate file service at `packages/web/src/services/fileService.ts`.

## Build

```bash
npm run build:core      # Build shared core
npm run build:server    # Build Express backend
npm run build:web       # Build Vue frontend (to packages/web/dist/)
npm run build:electron  # Build Electron main process
npm run build:all       # Build everything
```

## Server API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files/list?path=` | List directory contents |
| GET | `/api/files/read?path=` | Read file content |
| POST | `/api/files/write` | Write file `{ path, content }` |
| DELETE | `/api/files/delete?path=` | Delete file |
| POST | `/api/files/mkdir` | Create directory `{ path }` |
| DELETE | `/api/files/rmdir?path=` | Remove directory |
| GET | `/api/files/exists?path=` | Check path exists |
| GET | `/api/files/stat?path=` | Get file/dir metadata |
| POST | `/api/files/rename` | Rename `{ oldPath, newPath }` |
| POST | `/api/agent/chat` | Send message to agent |
| POST | `/api/agent/stream` | Stream agent response (SSE) |
| GET | `/api/health` | Health check |

## Project Structure

### `@vibeeditor/core`
- `fs/types.ts` — `IFileSystem` interface, `FileEntry`, `FileContent`
- `fs/local.ts` — `LocalFileSystem` (Node.js fs)
- `fs/server.ts` — `ServerFileSystem` (REST client)
- `fs/virtual.ts` — `VirtualFileSystem` (in-memory)
- `editor/types.ts` — `EditorTab`, `EditOperation`, language detection
- `editor/document.ts` — Tab/document state management
- `agent/types.ts` — `AgentContext`, `AgentEditResult`, `IAgentProvider`
- `agent/context.ts` — Context builder for LLM prompts
- `agent/executor.ts` — Edit operation executor with undo support

### `@vibeeditor/web`
- `components/editor/MonacoEditor.vue` — Monaco editor wrapper
- `components/file-tree/FileTree.vue` — File tree sidebar
- `components/toolbar/Toolbar.vue` — Top toolbar
- `components/agent/AgentPanel.vue` — AI chat panel
- `components/layout/MainLayout.vue` — Resizable layout
- `composables/useFileSystem.ts` — File operations + keyboard shortcuts
- `composables/useEditor.ts` — Monaco editor instance management
- `composables/useAgent.ts` — Agent chat state
- `stores/editor.ts` — Pinia store for editor/tabs state

### `@vibeeditor/server`
- `routes/files.ts` — File CRUD API with path traversal protection
- `routes/agent.ts` — Agent chat + streaming endpoints
- `middleware/auth.ts` — Optional Bearer token auth

### `@vibeeditor/electron`
- `main.ts` — Window creation, dev/production mode switching
- `preload.ts` — Context bridge exposing `window.electronAPI`
- `ipc/file-handler.ts` — Native file dialogs and FS operations
