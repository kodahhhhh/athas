import { useEffect, useMemo, useRef } from "react";
import type { SemanticTokenState } from "@/features/editor/lsp/use-semantic-tokens";
import { transformTokensForFolding } from "../utils/fold-transformer";
import { buildLineOffsetMap } from "@athas/editor-core/utils/html";
import type { Token } from "@athas/editor-core/utils/html";
import {
  canApplySemanticTokenState,
  mergeTokenLayers,
  semanticTokensToEditorTokens,
} from "@athas/editor-core/utils/token-layers";
import type { SyntaxTokenSnapshot } from "./use-tokenizer";
import { resolveSyntaxTokensForContent } from "../utils/syntax-tokenization";
import type { FoldTransformResult } from "./use-fold-transform";

interface UseAthasEditorTokensOptions {
  bufferId: string | null | undefined;
  content: string;
  normalizedEditorContent: string;
  filePath?: string;
  largeContentMode: boolean;
  tokenizationEnabled: boolean;
  tokens: Token[];
  tokenizedContent: string;
  semanticTokens?: SemanticTokenState;
  foldTransform: FoldTransformResult;
}

export function useAthasEditorTokens({
  bufferId,
  content,
  normalizedEditorContent,
  filePath,
  largeContentMode,
  tokenizationEnabled,
  tokens,
  tokenizedContent,
  semanticTokens,
  foldTransform,
}: UseAthasEditorTokensOptions): Token[] {
  const syntaxTokenSnapshotRef = useRef<SyntaxTokenSnapshot | null>(null);

  useEffect(() => {
    if (!bufferId || tokens.length === 0 || !tokenizedContent) return;
    syntaxTokenSnapshotRef.current = {
      bufferId,
      content: tokenizedContent,
      tokens,
    };
  }, [bufferId, tokenizedContent, tokens]);

  const baseTokens = useMemo(() => {
    if (!tokenizationEnabled) return [];

    return resolveSyntaxTokensForContent({
      tokens,
      tokenizedContent,
      normalizedContent: normalizedEditorContent,
      bufferId: bufferId || undefined,
      snapshot: syntaxTokenSnapshotRef.current,
    });
  }, [bufferId, normalizedEditorContent, tokenizationEnabled, tokenizedContent, tokens]);

  const semanticEditorTokens = useMemo(() => {
    if (largeContentMode) return [];
    if (!canApplySemanticTokenState(semanticTokens, filePath)) return [];

    const semanticContent = semanticTokens.content || normalizedEditorContent;
    if (semanticContent !== normalizedEditorContent) return [];

    return semanticTokensToEditorTokens(
      semanticTokens.tokens,
      buildLineOffsetMap(semanticContent),
      semanticContent.length,
    );
  }, [filePath, largeContentMode, normalizedEditorContent, semanticTokens]);

  const layeredTokens = useMemo(
    () => mergeTokenLayers(baseTokens, semanticEditorTokens),
    [baseTokens, semanticEditorTokens],
  );

  return useMemo(() => {
    if (!foldTransform.hasActiveFolds) return layeredTokens;
    return transformTokensForFolding(
      content,
      foldTransform.virtualLines,
      foldTransform.mapping,
      layeredTokens,
    );
  }, [content, foldTransform, layeredTokens]);
}
