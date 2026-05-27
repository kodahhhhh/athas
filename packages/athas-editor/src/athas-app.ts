import { convertFileSrc } from "@tauri-apps/api/core";
import { extensionRegistry } from "@/extensions/registry/extension-registry";
import { frontendTrace } from "@/utils/frontend-trace";
import { setFilePathUrlConverter } from "./host/file-url";
import { setEditorTraceHandler } from "./host/tracing";
import { setLanguageIdResolver } from "./utils/language-id";

setLanguageIdResolver((filePath) => extensionRegistry.getLanguageId(filePath));
setEditorTraceHandler(frontendTrace);
setFilePathUrlConverter(convertFileSrc);

export { Editor } from "./components/editor";
export type { EditorProps } from "./components/editor";
export { InlineEditPopover } from "./components/inline-edit-popover";
export { useInlineEdit } from "./hooks/use-inline-edit";
export {
  resolveSyntaxTokensForContent,
  retargetTokensForContentEdit,
} from "./utils/syntax-tokenization";
export { getLanguageId, useTokenizer } from "./hooks/use-tokenizer";
export type { SyntaxTokenSnapshot } from "./hooks/use-tokenizer";
