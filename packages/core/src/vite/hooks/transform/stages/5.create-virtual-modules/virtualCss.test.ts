import { build } from "vite";
import { assert } from "vitest";
import { buildModuleId } from "../fixtures/buildModuleId";
import { test } from "../fixtures/extendedTest";

test("should create css string from partial styles and importer id", async ({
  expect,
  transformResult,
  buildInlineConfig,
}) => {
  const moduleId = buildModuleId({
    relativePath: "./fixtures/styles.ts",
    root: import.meta.url,
  });
  await build(buildInlineConfig(moduleId));

  const r = transformResult[moduleId];
  assert(r);
  const { cssModule, globalStyle } = r.stages[5] ?? {};

  assert(cssModule?.importId && cssModule.style);
  expect(cssModule.style).toMatch(/\.foo *\{/);

  assert(globalStyle?.importId && globalStyle.style);
  expect(globalStyle.style).toMatch(/body *{/);
});
