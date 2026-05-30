/** 判断路径是否为 LLM 误输出的模板占位符 */
function isPlaceholderPath(p: string): boolean {
  // 已知的模板示例路径
  const placeholders = ['path/to/file', 'path/to/File'];
  if (placeholders.includes(p)) return true;
  // 匹配 "path/to/<something>" 模式（不含真实扩展名的通用路径）
  if (/^path\/to\/\w+$/i.test(p)) return true;
  return false;
}

/** 解析出的编辑块 */
export interface ParsedEdit {
  path: string;
  content: string;
}

/**
 * 从 LLM 回复中解析 <edit path="...">...</edit> 编辑块。
 * 自动去除 edit 内容外层的 markdown 代码围栏。
 */
export function parseEditsFromText(text: string): ParsedEdit[] {
  const edits: ParsedEdit[] = [];
  const re = /<edit\s+path="([^"]+)"\s*>([\s\S]*?)<\/edit>/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const filePath = match[1].trim();
    let rawContent = match[2].trim();

    // 跳过明显的占位符路径（LLM 可能误输出模板示例）
    if (isPlaceholderPath(filePath)) continue;

    const codeBlockRe = /^```[\w]*\n([\s\S]*?)\n```$/;
    const codeBlockMatch = rawContent.match(codeBlockRe);
    if (codeBlockMatch) {
      rawContent = codeBlockMatch[1];
    }

    edits.push({ path: filePath, content: rawContent });
  }

  return edits;
}
