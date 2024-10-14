import { build } from "vite";
import { assert } from "vitest";
import { buildModuleId } from "../fixtures/buildModuleId";
import { test } from "../fixtures/extendedTest";
import { notCss, styleA } from "./fixtures/simple";

test("should replace variable initializations with `styles[xxx]`, then append `import styles from 'xxx.css'`", async ({
  expect,
  buildInlineConfig,
  transformResult,
}) => {
  const moduleId = buildModuleId({
    relativePath: "./fixtures/simple.tsx",
    root: import.meta.url,
  });
  await build(buildInlineConfig(moduleId));

  const { transformed, cssLookupApi } = transformResult[moduleId] ?? {};
  assert(transformed && cssLookupApi);

  assert(transformed);
  expect(transformed).not.toMatch(styleA);
  expect(transformed).not.toMatch("export const styleB");
  expect(transformed).toMatch(notCss);

  assert(cssLookupApi.cssModule.getFromJsPath(moduleId));
});

test("should remove temporal variables, import global styles", async ({
  expect,
  buildInlineConfig,
  transformResult,
}) => {
  const moduleId = buildModuleId({
    relativePath: "./fixtures/globalOnly.ts",
    root: import.meta.url,
  });
  await build(buildInlineConfig(moduleId));

  const { transformed, cssLookupApi } = transformResult[moduleId] ?? {};
  assert(transformed && cssLookupApi);

  assert(transformed);
  expect(transformed).not.toMatch("box-sizing");

  assert(cssLookupApi.globalStyle.getFromJsPath(moduleId));
});

test("should work with a file using both `css` and `injectGlobal`", async ({
  expect,
  transformResult,
  buildInlineConfig,
}) => {
  const moduleId = buildModuleId({
    relativePath: "./fixtures/mixed.ts",
    root: import.meta.url,
  });
  await build(buildInlineConfig(moduleId));

  const { transformed, cssLookupApi } = transformResult[moduleId] ?? {};
  assert(transformed && cssLookupApi);

  assert(transformed);
  expect(transformed).not.toMatch("aliceblue");
  expect(transformed).not.toMatch("box-sizing");

  assert(cssLookupApi.cssModule.getFromJsPath(moduleId));
  assert(cssLookupApi.globalStyle.getFromJsPath(moduleId));
});
