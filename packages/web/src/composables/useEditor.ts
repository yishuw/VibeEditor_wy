import { ref, watch, onBeforeUnmount, type Ref } from 'vue';

export function useEditor(editorRef: Ref<any>) {
  const monacoRef = ref<any>(null);
  const editorInstance = ref<any>(null);

  function setModel(language: string, content: string) {
    if (!monacoRef.value) return;
    const monaco = monacoRef.value;
    const uri = monaco.Uri.parse(`file:///editor-${Date.now()}.${language === 'typescript' ? 'ts' : language === 'javascript' ? 'js' : 'txt'}`);
    let model = monaco.editor.getModel(uri);
    if (!model) {
      model = monaco.editor.createModel(content, language, uri);
    } else {
      model.setValue(content);
    }
    editorInstance.value?.setModel(model);
    return model;
  }

  function getContent(): string {
    return editorInstance.value?.getValue() ?? '';
  }

  function updateContent(content: string) {
    const editor = editorInstance.value;
    if (!editor) return;
    const position = editor.getPosition();
    editor.setValue(content);
    if (position) editor.setPosition(position);
  }

  function getSelection(): { text: string; startLine: number; endLine: number } | null {
    const editor = editorInstance.value;
    if (!editor) return null;
    const selection = editor.getSelection();
    if (!selection) return null;
    const model = editor.getModel();
    if (!model) return null;
    return {
      text: model.getValueInRange(selection),
      startLine: selection.startLineNumber,
      endLine: selection.endLineNumber,
    };
  }

  function dispose() {
    editorInstance.value?.dispose();
  }

  return { monacoRef, editorInstance, setModel, getContent, updateContent, getSelection, dispose };
}
