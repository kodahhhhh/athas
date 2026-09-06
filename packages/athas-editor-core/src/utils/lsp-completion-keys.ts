const COMPLETION_PAGE_SIZE = 5;

export interface FilteredCompletionLike<TCompletion> {
  item: TCompletion;
}

export interface CompletionKeyState {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
}

export type LspCompletionKeyAction<TCompletion> =
  | {
      type: "select";
      selectedIndex: number;
    }
  | {
      type: "apply";
      completion: TCompletion;
      selectedIndex: number;
    }
  | {
      type: "hide";
    };

function normalizeCompletionIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (index < 0 || index >= length) return 0;
  return index;
}

function wrapCompletionIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (index < 0) return length - 1;
  if (index >= length) return 0;
  return index;
}

export function resolveLspCompletionKeyAction<TCompletion>({
  keyState,
  isVisible,
  filteredCompletions,
  selectedIndex,
}: {
  keyState: CompletionKeyState;
  isVisible: boolean;
  filteredCompletions: FilteredCompletionLike<TCompletion>[];
  selectedIndex: number;
}): LspCompletionKeyAction<TCompletion> | null {
  if (!isVisible) return null;

  const hasCommandModifier = !!keyState.metaKey || !!keyState.ctrlKey || !!keyState.altKey;
  if (hasCommandModifier) return null;

  if (keyState.key === "Escape") {
    return { type: "hide" };
  }

  const completionCount = filteredCompletions.length;
  if (completionCount === 0) return null;

  const normalizedIndex = normalizeCompletionIndex(selectedIndex, completionCount);

  if (keyState.key === "ArrowDown") {
    return {
      type: "select",
      selectedIndex: wrapCompletionIndex(normalizedIndex + 1, completionCount),
    };
  }

  if (keyState.key === "ArrowUp") {
    return {
      type: "select",
      selectedIndex: wrapCompletionIndex(normalizedIndex - 1, completionCount),
    };
  }

  if (keyState.key === "PageDown") {
    return {
      type: "select",
      selectedIndex: Math.min(completionCount - 1, normalizedIndex + COMPLETION_PAGE_SIZE),
    };
  }

  if (keyState.key === "PageUp") {
    return {
      type: "select",
      selectedIndex: Math.max(0, normalizedIndex - COMPLETION_PAGE_SIZE),
    };
  }

  if (keyState.key === "Home") {
    return {
      type: "select",
      selectedIndex: 0,
    };
  }

  if (keyState.key === "End") {
    return {
      type: "select",
      selectedIndex: completionCount - 1,
    };
  }

  if (keyState.key === "Enter" || (keyState.key === "Tab" && !keyState.shiftKey)) {
    const completion = filteredCompletions[normalizedIndex]?.item;
    if (!completion) return null;

    return {
      type: "apply",
      completion,
      selectedIndex: normalizedIndex,
    };
  }

  return null;
}
