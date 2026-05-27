export type EditorTraceLevel = "debug" | "info" | "warn" | "error";

export interface EditorTraceHandler {
  (
    level: EditorTraceLevel,
    scope: string,
    message: string,
    payload?: Record<string, unknown>,
  ): void;
}

let traceHandler: EditorTraceHandler | null = null;

export function setEditorTraceHandler(handler: EditorTraceHandler | null): void {
  traceHandler = handler;
}

export function traceEditorEvent(
  level: EditorTraceLevel,
  scope: string,
  message: string,
  payload?: Record<string, unknown>,
): void {
  traceHandler?.(level, scope, message, payload);
}
