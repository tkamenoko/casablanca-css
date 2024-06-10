import { build } from "vite";
import { assert } from "vitest";
import { buildModuleId } from "../fixtures/buildModuleId";
import { test } from "../fixtures/extendedTest";

test("should assign styles", async ({
  expect,
  buildInlineConfig,
  transformResult,
}) => {
  const moduleId = buildModuleId({
    relativePath: "./fixtures/composing.tsx",
    root: import.meta.url,
  });
  await build(buildInlineConfig(moduleId));

  const r = transformResult[moduleId];
  assert(r);
  const { composedStyles } = r.stages[4] ?? {};
  assert(composedStyles?.length);

  for (const { style, originalName } of composedStyles) {
    switch (originalName) {
      case "styleA": {
        expect(style).toMatch(/color: red;/);
        expect(style).not.toMatch(/font-size:;/);
        break;
      }
      case "styleB": {
        expect(style).toMatch(/color: red;/);
        expect(style).toMatch(/font-size:/);
        expect(style).toMatch(/display:/);
        expect(style).toMatch(/border:/);
        break;
      }
    }
  }
});
