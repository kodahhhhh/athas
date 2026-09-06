export interface Position {
  line: number;
  column: number;
  offset: number;
}

// https://docs.rs/lsp-positions/latest/lsp_positions/struct.Position.html
export interface LSPPosition {
  line: number;
  character: number;
  offset: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Cursor {
  position: Position;
  selection?: Range;
  id: string;
}

export interface MultiCursorState {
  cursors: Cursor[];
  primaryCursorId: string;
}

export interface LineToken {
  startColumn: number;
  endColumn: number;
  className: string;
}

export interface Decoration {
  range: Range;
  className?: string;
  type: "inline" | "overlay" | "gutter" | "line";
  content?: unknown;
}

export interface Change {
  range: Range;
  text: string;
  origin: string;
}

export interface SemanticToken {
  line: number;
  startChar: number;
  length: number;
  tokenType: number;
  tokenTypeName?: string;
  tokenModifiers: number;
}

export interface SemanticTokenState {
  tokens: SemanticToken[];
  content: string;
  filePath?: string;
}

export type RenderWhitespaceMode = "none" | "boundary" | "trailing" | "all";

export interface InlayHint {
  line: number;
  character: number;
  label: string;
  kind?: string;
  paddingLeft: boolean;
  paddingRight: boolean;
}

export interface InlayHintLineRange {
  startLine: number;
  endLine: number;
}

export interface FoldRegion {
  startLine: number;
  endLine: number;
  indentLevel: number;
  kind?: "generic" | "diff-file" | "diff-hunk";
}

export interface GitDiffLine {
  line_type: "added" | "removed" | "context" | "header";
  content: string;
  old_line_number?: number;
  new_line_number?: number;
}

export interface GitDiff {
  file_path: string;
  old_path?: string;
  new_path?: string;
  is_new: boolean;
  is_deleted: boolean;
  is_renamed: boolean;
  lines: GitDiffLine[];
  is_binary?: boolean;
  is_image?: boolean;
  old_blob_base64?: string;
  new_blob_base64?: string;
  raw_patch?: string;
  additions?: number;
  deletions?: number;
}

export interface GitHunk {
  file_path: string;
  lines: GitDiffLine[];
}

export interface HighlightToken {
  type: string;
  startIndex: number;
  endIndex: number;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
}

export interface EditorConfigProperties {
  indentStyle?: "tab" | "space";
  indentSize?: number;
  tabWidth?: number;
  endOfLine?: "lf" | "crlf" | "cr";
  charset?: string;
  trimTrailingWhitespace?: boolean;
  insertFinalNewline?: boolean;
  maxLineLength?: number;
}

export interface TabStop {
  index: number;
  placeholder?: string;
  choices?: string[];
  offset: number;
  length: number;
}

export interface ParsedSnippet {
  body: string;
  expandedBody: string;
  tabStops: TabStop[];
  hasTabStops: boolean;
}

export interface SnippetSession {
  snippetId: string;
  parsedSnippet: ParsedSnippet;
  currentTabStopIndex: number;
  insertPosition: Position;
  isActive: boolean;
}

export interface Snippet {
  prefix: string;
  body: string | string[];
  description?: string;
  scope?: string;
  language: string;
}

export interface FilteredCompletion<TCompletion = unknown> {
  item: TCompletion;
  score: number;
  indices: number[];
}
