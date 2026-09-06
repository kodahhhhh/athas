/**
 * Syntax tokenization hook backed by a dedicated worker.
 * This keeps Tree-sitter parsing and query execution off the UI thread.
 */

import { useCallback, useRef, useState } from "react";
import type { HighlightToken } from "@athas/editor-core";
import { logger } from "../utils/logger";
import { getLanguageAssetConfig } from "@/features/editor/lib/wasm-parser/extension-assets";
import { tokenizerWorkerClient } from "@/features/editor/lib/wasm-parser/tokenizer-worker-client";
import { buildLineOffsetMap, normalizeLineEndings, type Token } from "../utils/html";
import { getLanguageIdFromPath } from "../utils/language-id";
import {
  hasLineBasedSyntaxHighlighter,
  tokenizeLineBasedSyntax,
} from "@/features/editor/utils/line-based-syntax";
import {
  expandTokenizationViewportRange,
  mergeTokenizedRange,
  retargetTokensForContentEdit,
  TOKENIZATION_LARGE_FILE_LINE_THRESHOLD,
} from "../utils/syntax-tokenization";
import { usePerformanceMonitor } from "./use-performance";
import type { ViewportRange } from "./use-viewport-lines";

interface TokenizerOptions {
  filePath: string | undefined;
  bufferId?: string;
  languageIdOverride?: string;
  enabled?: boolean;
  incremental?: boolean;
}

interface TokenCache {
  fullTokens: Token[];
  previousContent: string;
}

interface TextMetricsCache {
  text: string;
  normalizedText: string;
  lineOffsets: number[];
  lineCount: number;
}

interface TokenState {
  bufferId?: string;
  tokens: Token[];
}

export type { SyntaxTokenSnapshot } from "../utils/syntax-tokenization";

export function getLanguageId(filePath: string): string | null {
  return getLanguageIdFromPath(filePath);
}

function convertToToken(highlightToken: HighlightToken): Token {
  return {
    start: highlightToken.startIndex,
    end: highlightToken.endIndex,
    class_name: highlightToken.type,
  };
}

const BACKGROUND_FULL_TOKENIZE_CHAR_THRESHOLD = 200_000;
const BACKGROUND_FULL_TOKENIZE_LINE_THRESHOLD = 4_000;
const BACKGROUND_FULL_TOKENIZE_DELAY_MS = 900;
const BACKGROUND_FULL_TOKENIZE_IDLE_TIMEOUT_MS = 2000;

export function useTokenizer({
  filePath,
  bufferId,
  languageIdOverride,
  enabled = true,
  incremental = true,
}: TokenizerOptions) {
  const [tokenState, setTokenState] = useState<TokenState>({ tokens: [] });
  const [tokenizedContent, setTokenizedContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<TokenCache>({
    fullTokens: [],
    previousContent: "",
  });
  const textMetricsRef = useRef<TextMetricsCache | null>(null);
  const requestVersionRef = useRef(0);
  const backgroundSweepVersionRef = useRef(0);
  const backgroundSweepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { startMeasure, endMeasure } = usePerformanceMonitor("Tokenizer");
  const tokens = tokenState.bufferId === bufferId ? tokenState.tokens : [];

  const retargetCachedTokens = useCallback(
    (normalizedText: string) => {
      if (!bufferId) return;

      const cached = cacheRef.current;
      const retargetedTokens = retargetTokensForContentEdit(
        cached.fullTokens,
        cached.previousContent,
        normalizedText,
      );

      if (retargetedTokens === cached.fullTokens) {
        return;
      }

      cacheRef.current = {
        fullTokens: retargetedTokens,
        previousContent: normalizedText,
      };
      setTokenState({ bufferId, tokens: retargetedTokens });
      setTokenizedContent(normalizedText);
    },
    [bufferId],
  );

  const getTextMetrics = useCallback((text: string): TextMetricsCache => {
    const cached = textMetricsRef.current;
    if (cached && cached.text === text) {
      return cached;
    }

    const normalizedText = normalizeLineEndings(text);
    const lineOffsets = buildLineOffsetMap(text);
    const nextMetrics: TextMetricsCache = {
      text,
      normalizedText,
      lineOffsets,
      lineCount: lineOffsets.length,
    };
    textMetricsRef.current = nextMetrics;
    return nextMetrics;
  }, []);

  const tokenizeFull = useCallback(
    async (text: string) => {
      if (!enabled || !filePath || !bufferId) return;

      const languageId = languageIdOverride || getLanguageId(filePath);
      if (!languageId) {
        logger.warn("Editor", `[Tokenizer] No language mapping for ${filePath}`);
        setTokenState({ bufferId, tokens: [] });
        return;
      }

      const requestVersion = ++requestVersionRef.current;
      const normalizedText = normalizeLineEndings(text);

      if (hasLineBasedSyntaxHighlighter(languageId)) {
        const newTokens = tokenizeLineBasedSyntax(normalizedText, languageId);
        setTokenState({ bufferId, tokens: newTokens });
        setTokenizedContent(normalizedText);
        cacheRef.current = {
          fullTokens: newTokens,
          previousContent: normalizedText,
        };
        return;
      }

      const languageAssets = getLanguageAssetConfig(languageId);

      retargetCachedTokens(normalizedText);
      setLoading(true);
      startMeasure(`tokenizeFull (len: ${normalizedText.length})`);

      try {
        const result = await tokenizerWorkerClient.tokenize({
          bufferId,
          content: normalizedText,
          languageId,
          wasmPath: languageAssets.wasmPath,
          highlightQueryUrl: languageAssets.highlightQueryUrl,
          mode: "full",
        });

        if (requestVersion !== requestVersionRef.current) return;

        const newTokens = result.tokens.map(convertToToken);
        setTokenState({ bufferId, tokens: newTokens });
        setTokenizedContent(result.normalizedText);
        cacheRef.current = {
          fullTokens: newTokens,
          previousContent: result.normalizedText,
        };
      } catch (error) {
        if (requestVersion !== requestVersionRef.current) return;
        logger.warn("Editor", "[Tokenizer] Full tokenization failed:", error);
        setTokenState({ bufferId, tokens: [] });
        setTokenizedContent("");
      } finally {
        if (requestVersion === requestVersionRef.current) {
          setLoading(false);
        }
        endMeasure(`tokenizeFull (len: ${normalizedText.length})`);
      }
    },
    [
      enabled,
      filePath,
      bufferId,
      languageIdOverride,
      retargetCachedTokens,
      startMeasure,
      endMeasure,
    ],
  );

  const tokenizeRangeInternal = useCallback(
    async (text: string, viewportRange: ViewportRange) => {
      if (!enabled || !filePath || !bufferId) return;

      const languageId = languageIdOverride || getLanguageId(filePath);
      if (!languageId) return;

      const requestVersion = ++requestVersionRef.current;
      const { normalizedText, lineOffsets, lineCount } = getTextMetrics(text);
      const shouldScheduleBackgroundFullSweep =
        lineCount <= BACKGROUND_FULL_TOKENIZE_LINE_THRESHOLD &&
        normalizedText.length <= BACKGROUND_FULL_TOKENIZE_CHAR_THRESHOLD;

      retargetCachedTokens(normalizedText);
      setLoading(true);
      startMeasure("tokenizeRangeInternal");

      try {
        const tokenizationRange = expandTokenizationViewportRange(viewportRange, lineCount);

        if (hasLineBasedSyntaxHighlighter(languageId)) {
          const rangeTokens = tokenizeLineBasedSyntax(normalizedText, languageId, {
            startLine: tokenizationRange.startLine,
            endLine: tokenizationRange.endLine,
          });
          const rangeStartOffset = lineOffsets[tokenizationRange.startLine] ?? 0;
          const rangeEndOffset =
            lineOffsets[tokenizationRange.endLine + 1] ?? normalizedText.length;
          const mergedTokens = mergeTokenizedRange({
            cachedTokens: cacheRef.current.fullTokens,
            rangeTokens,
            rangeStartOffset,
            rangeEndOffset,
            retainOutsideRange: lineCount < TOKENIZATION_LARGE_FILE_LINE_THRESHOLD,
          });

          setTokenState({ bufferId, tokens: mergedTokens });
          setTokenizedContent(normalizedText);
          cacheRef.current.fullTokens = mergedTokens;
          cacheRef.current.previousContent = normalizedText;
          return;
        }

        const languageAssets = getLanguageAssetConfig(languageId);

        const result = await tokenizerWorkerClient.tokenize({
          bufferId,
          content: normalizedText,
          languageId,
          wasmPath: languageAssets.wasmPath,
          highlightQueryUrl: languageAssets.highlightQueryUrl,
          mode: "range",
          viewportRange: {
            startLine: tokenizationRange.startLine,
            endLine: tokenizationRange.endLine,
          },
        });

        if (requestVersion !== requestVersionRef.current) return;

        const rangeTokens = result.tokens.map(convertToToken);
        const rangeStartOffset = lineOffsets[tokenizationRange.startLine] ?? 0;
        const rangeEndOffset = lineOffsets[tokenizationRange.endLine + 1] ?? normalizedText.length;
        const mergedTokens = mergeTokenizedRange({
          cachedTokens: cacheRef.current.fullTokens,
          rangeTokens,
          rangeStartOffset,
          rangeEndOffset,
          retainOutsideRange: lineCount < TOKENIZATION_LARGE_FILE_LINE_THRESHOLD,
        });

        setTokenState({ bufferId, tokens: mergedTokens });
        setTokenizedContent(result.normalizedText);
        cacheRef.current.fullTokens = mergedTokens;
        cacheRef.current.previousContent = result.normalizedText;

        if (shouldScheduleBackgroundFullSweep) {
          const sweepVersion = ++backgroundSweepVersionRef.current;
          if (backgroundSweepTimerRef.current !== null) {
            globalThis.clearTimeout(backgroundSweepTimerRef.current);
          }
          backgroundSweepTimerRef.current = globalThis.setTimeout(() => {
            const runFullSweep = () => {
              if (requestVersionRef.current !== requestVersion) return;
              if (backgroundSweepVersionRef.current !== sweepVersion) return;
              void tokenizeFull(result.normalizedText);
            };

            if ("requestIdleCallback" in globalThis) {
              globalThis.requestIdleCallback(runFullSweep, {
                timeout: BACKGROUND_FULL_TOKENIZE_IDLE_TIMEOUT_MS,
              });
            } else {
              runFullSweep();
            }
            backgroundSweepTimerRef.current = null;
          }, BACKGROUND_FULL_TOKENIZE_DELAY_MS);
        }
      } catch (error) {
        if (requestVersion !== requestVersionRef.current) return;
        logger.warn("Editor", "[Tokenizer] Range tokenization failed:", error);
      } finally {
        if (requestVersion === requestVersionRef.current) {
          setLoading(false);
        }
        endMeasure("tokenizeRangeInternal");
      }
    },
    [
      enabled,
      filePath,
      bufferId,
      languageIdOverride,
      getTextMetrics,
      retargetCachedTokens,
      tokenizeFull,
      startMeasure,
      endMeasure,
    ],
  );

  const tokenize = useCallback(
    async (text: string, viewportRange?: ViewportRange) => {
      if (!incremental || !viewportRange) {
        return tokenizeFull(text);
      }

      return tokenizeRangeInternal(text, viewportRange);
    },
    [incremental, tokenizeFull, tokenizeRangeInternal],
  );

  const forceFullTokenize = useCallback(async (text: string) => tokenizeFull(text), [tokenizeFull]);

  const resetForBufferSwitch = useCallback(() => {
    requestVersionRef.current += 1;
    backgroundSweepVersionRef.current += 1;
    if (backgroundSweepTimerRef.current !== null) {
      globalThis.clearTimeout(backgroundSweepTimerRef.current);
      backgroundSweepTimerRef.current = null;
    }
    cacheRef.current = {
      fullTokens: [],
      previousContent: "",
    };
    textMetricsRef.current = null;
    setTokenState({ tokens: [] });
    setTokenizedContent("");
    setLoading(false);
  }, []);

  return { tokens, tokenizedContent, loading, tokenize, forceFullTokenize, resetForBufferSwitch };
}
