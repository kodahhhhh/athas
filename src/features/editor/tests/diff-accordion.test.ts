import { describe, expect, it } from "vite-plus/test";
import {
  createCollapsedDiffAccordionLine,
  createDiffAccordionLine,
  parseDiffAccordionLine,
} from "@athas/editor-core/utils/diff-accordion";
import { parseDiffAccordionLine as parseGitDiffAccordionLine } from "@/features/git/utils/diff-editor-content";

describe("diff accordion metadata", () => {
  it("round-trips editor-owned accordion metadata", () => {
    const line = createDiffAccordionLine({
      name: "app.ts",
      path: "src/app.ts",
      status: "modified",
      collapsed: false,
    });

    expect(parseDiffAccordionLine(line)).toEqual({
      name: "app.ts",
      path: "src/app.ts",
      status: "modified",
      collapsed: false,
    });
  });

  it("creates collapsed accordion lines without Git feature imports", () => {
    const line = createCollapsedDiffAccordionLine({
      name: "app.ts",
      path: "src/app.ts",
      status: "deleted",
      hiddenCount: 8,
    });

    expect(parseDiffAccordionLine(line)).toEqual({
      name: "app.ts",
      path: "src/app.ts",
      status: "deleted",
      collapsed: true,
      hiddenCount: 8,
    });
  });

  it("keeps the Git compatibility export aligned with editor-core parsing", () => {
    const line = createDiffAccordionLine({
      name: "new.ts",
      path: "src/new.ts",
      status: "added",
      collapsed: false,
    });

    expect(parseGitDiffAccordionLine(line)).toEqual(parseDiffAccordionLine(line));
  });
});
