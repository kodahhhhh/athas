import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vite-plus/test";

const root = fileURLToPath(new URL("../../../..", import.meta.url));
const packageRoots: Record<string, string> = {
  "@athas/editor": path.join(root, "packages/athas-editor"),
  "@athas/editor-core": path.join(root, "packages/athas-editor-core"),
};

function resolveSource(candidate: string): string {
  const resolved = [candidate, `${candidate}.ts`, `${candidate}.tsx`, `${candidate}/index.ts`].find(
    (file) => existsSync(file),
  );
  if (!resolved) throw new Error(`Missing editor module: ${candidate}`);
  return resolved;
}

describe("reusable editor package boundaries", () => {
  it("keeps explicit public exports valid for consumers outside the app tsconfig", () => {
    for (const packageRoot of Object.values(packageRoots)) {
      const manifest = JSON.parse(readFileSync(path.join(packageRoot, "package.json"), "utf8"));
      for (const target of Object.values(manifest.exports) as string[]) {
        expect(target.startsWith("./")).toBe(true);
        if (!target.includes("*")) expect(existsSync(path.join(packageRoot, target))).toBe(true);
      }
    }
  });

  it("keeps the default editor and core entry points free of desktop dependencies", () => {
    const visited = new Set<string>();
    const pending = Object.values(packageRoots).map((directory) =>
      path.join(directory, "src/index.ts"),
    );
    while (pending.length > 0) {
      const file = pending.pop()!;
      if (visited.has(file)) continue;
      visited.add(file);
      const source = readFileSync(file, "utf8");
      for (const { fileName: specifier } of ts.preProcessFile(source).importedFiles) {
        expect(specifier, `${file} imports a desktop module`).not.toMatch(/^@\/|^@tauri-apps\//);
        if (specifier.startsWith(".")) {
          pending.push(resolveSource(path.resolve(path.dirname(file), specifier)));
          continue;
        }
        for (const [name, directory] of Object.entries(packageRoots)) {
          if (specifier === name || specifier.startsWith(`${name}/`)) {
            const subpath = specifier === name ? "index" : specifier.slice(name.length + 1);
            pending.push(resolveSource(path.join(directory, "src", subpath)));
            break;
          }
        }
      }
    }
    expect(visited.size).toBeGreaterThan(20);
  });
});
