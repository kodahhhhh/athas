import { describe, expect, it } from "vite-plus/test";
import { setEditorTraceHandler, traceEditorEvent } from "@athas/editor";

describe("editor host tracing", () => {
  it("allows host applications to provide the editor trace sink", () => {
    const events: Array<{
      level: string;
      scope: string;
      message: string;
      payload?: Record<string, unknown>;
    }> = [];

    setEditorTraceHandler((level, scope, message, payload) => {
      events.push({ level, scope, message, payload });
    });

    try {
      traceEditorEvent("info", "bench:perf", "Editor:render", {
        durationMs: 12,
      });

      expect(events).toEqual([
        {
          level: "info",
          scope: "bench:perf",
          message: "Editor:render",
          payload: { durationMs: 12 },
        },
      ]);
    } finally {
      setEditorTraceHandler(null);
    }
  });
});
