let instance: import('monaco-editor').editor.IStandaloneCodeEditor | null = null

export function getEditorInstance() {
  return instance
}

export function setEditorInstance(editor: typeof instance) {
  instance = editor
}

export function clearEditorInstance() {
  if (instance) {
    instance.dispose()
    instance = null
  }
}
