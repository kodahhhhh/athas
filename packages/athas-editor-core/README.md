# @athas/editor-core

Framework-independent editor primitives from Athas.

This package is the lowest-level editor package. It contains TypeScript types,
layout constants, view-model helpers, text operations, search helpers, language
detection defaults, diff accordion metadata, folding, diff, inlay hint,
tokenization, snippet, completion, and editor config shapes, selection math,
token utilities, and other editor logic that can be reused by desktop, web,
mobile, and hosted editor surfaces.

It intentionally avoids React, Tauri, Zustand, extension registry, LSP client,
and Athas app-store imports.

Public entry points:

- `@athas/editor-core`
- `@athas/editor-core/constants`
- `@athas/editor-core/types`
- `@athas/editor-core/utils/*`
- `@athas/editor-core/utils/path-helpers`
- `@athas/editor-core/utils/search-match`
- `@athas/editor-core/view-model/*`
