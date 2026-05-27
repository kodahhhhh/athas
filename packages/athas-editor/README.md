# @athas/editor

Reusable Athas editor package.

This package owns the reusable editor surface primitives, editor view model helpers,
and editor utility functions that used to live under `src/features/athas-editor`.

The current package is source-consumed by the Athas Tauri app through the
`@athas/editor` workspace dependency. The default `@athas/editor` entry point is
kept app-independent so web, mobile, and downstream hosts can reuse core editor
types, constants, utilities, and low-level React primitives without pulling in
Athas desktop services.

The full Athas-wired editor lives behind `@athas/editor/athas-app`. That entry
still depends on host app services for buffers, LSP, settings, diagnostics, git,
keymaps, AI inline edit, terminal previews, and shared UI primitives. Keep new
editor-specific code in this package; move host-specific behavior behind narrow
imports or adapter props as those boundaries become clear.

Related packages:

- `@athas/editor-core`: shared editor constants and core TypeScript types.

Basic controlled usage:

```tsx
import { useState } from "react";
import { ControlledEditor } from "@athas/editor";

export function Example() {
  const [value, setValue] = useState("console.log('hello from Athas');\n");

  return <ControlledEditor value={value} onChange={setValue} ariaLabel="Example code editor" />;
}
```

Language detection:

- `@athas/editor-core/utils/language-id` provides default file-extension and
  well-known filename mappings with no host dependencies.
- `@athas/editor/utils/language-id` adds `setLanguageIdResolver(...)` so a host
  can layer custom language IDs on top of those defaults.
- `@athas/editor/utils/language-detection` provides the package-level
  `detectLanguageFromPath(...)` and `detectLanguageFromFileName(...)` helpers
  without importing Athas desktop extension services.
- `@athas/editor/athas-app` registers Athas's extension registry as that
  resolver for the desktop app integration.

Host services:

- `setEditorTraceHandler(...)` lets a host wire editor performance and benchmark
  events into its own telemetry sink.
- `setFilePathUrlConverter(...)` lets a host map local file paths to browser-safe
  URLs for editor-owned HTML preview helpers.
- `@athas/editor/athas-app` registers Athas's existing `frontendTrace` sink for
  telemetry and Tauri's `convertFileSrc` for file URL conversion in the desktop
  app integration.

Diagnostics:

- `@athas/editor/decorations/diagnostic-decorations` exposes editor-owned
  diagnostic decoration helpers and the structural `EditorDiagnostic` type.
  Hosts can adapt their own diagnostics into that shape without importing Athas
  app diagnostics.

Diff metadata:

- `@athas/editor-core/utils/diff-accordion` owns the hidden diff accordion marker
  format used by editor rendering and folding. Git serialization re-exports that
  parser for compatibility.

Shared editor types:

- `@athas/editor-core` owns reusable editor data shapes such as `Position`,
  `Range`, `SemanticTokenState`, `RenderWhitespaceMode`, `InlayHint`,
  `FoldRegion`, `GitDiffLine`, `HighlightToken`, `EditorConfigProperties`,
  and snippet/completion metadata.

Public entry points:

- `@athas/editor`
- `@athas/editor/athas-app`
- `@athas/editor/components/controlled-editor`
- `@athas/editor/components/large-editor-surface`
- `@athas/editor/decorations/diagnostic-decorations`
- `@athas/editor/host/file-url`
- `@athas/editor/host/tracing`
- `@athas/editor/utils/[core utility]`
- `@athas/editor/utils/language-id`
- `@athas/editor/utils/path-helpers`
- `@athas/editor/utils/search-match`
- `@athas/editor/view-model/view-layout`
- `@athas/editor/styles/*`
