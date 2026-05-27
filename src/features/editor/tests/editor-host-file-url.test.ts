import { describe, expect, it } from "vite-plus/test";
import { convertFilePathToUrl, setFilePathUrlConverter } from "@athas/editor/host/file-url";

describe("editor host file URL conversion", () => {
  it("allows host applications to provide the file path URL converter", () => {
    setFilePathUrlConverter((path) => `asset://${path}`);

    try {
      expect(convertFilePathToUrl("/workspace/index.html")).toBe("asset:///workspace/index.html");
    } finally {
      setFilePathUrlConverter(null);
    }
  });

  it("falls back to the original path when no host converter is registered", () => {
    setFilePathUrlConverter(null);

    expect(convertFilePathToUrl("/workspace/index.html")).toBe("/workspace/index.html");
  });
});
