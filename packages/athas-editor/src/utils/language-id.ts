import {
  getLanguageIdFromPath as getCoreLanguageIdFromPath,
  normalizeLanguageId,
} from "@athas/editor-core/utils/language-id";

export * from "@athas/editor-core/utils/language-id";

export type LanguageIdResolver = (filePath: string) => string | null | undefined;

let languageIdResolver: LanguageIdResolver | null = null;

export function setLanguageIdResolver(resolver: LanguageIdResolver | null): void {
  languageIdResolver = resolver;
}

export function getLanguageIdFromPath(filePath: string): string | null {
  const resolvedLanguageId = languageIdResolver?.(filePath);
  if (resolvedLanguageId) {
    return normalizeLanguageId(resolvedLanguageId);
  }

  return getCoreLanguageIdFromPath(filePath);
}
