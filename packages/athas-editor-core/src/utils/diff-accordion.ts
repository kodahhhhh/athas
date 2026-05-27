export const DIFF_ACCORDION_PREFIX = "\uE000ATHAS_DIFF_FILE ";

export interface DiffAccordionLineMeta {
  name: string;
  path: string;
  status: "added" | "deleted" | "modified" | "renamed";
  collapsed: boolean;
  hiddenCount?: number;
}

export function isDiffAccordionLine(line: string): boolean {
  return line.startsWith(DIFF_ACCORDION_PREFIX);
}

export function parseDiffAccordionLine(line: string): DiffAccordionLineMeta | null {
  if (!isDiffAccordionLine(line)) return null;

  try {
    return JSON.parse(line.slice(DIFF_ACCORDION_PREFIX.length)) as DiffAccordionLineMeta;
  } catch {
    return null;
  }
}

export function createDiffAccordionLine(meta: DiffAccordionLineMeta): string {
  return `${DIFF_ACCORDION_PREFIX}${JSON.stringify(meta)}`;
}

export function createCollapsedDiffAccordionLine(
  meta: Omit<DiffAccordionLineMeta, "collapsed">,
): string {
  return createDiffAccordionLine({
    ...meta,
    collapsed: true,
  });
}
