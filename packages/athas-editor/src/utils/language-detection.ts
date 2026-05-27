import { getLanguageIdFromPath } from "./language-id";

/**
 * Detect programming language from file extension.
 */
export function detectLanguageFromPath(filePath: string): string {
  return getLanguageIdFromPath(filePath) || "text";
}

/**
 * Detect language from file name (handles special cases like Dockerfile, Makefile)
 */
export function detectLanguageFromFileName(fileName: string): string {
  return detectLanguageFromPath(fileName);
}
