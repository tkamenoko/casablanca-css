import { transformFromAstAsync } from "@babel/core";
import { build } from "vite";
import { assert } from "vitest";
import { buildModuleId } from "../fixtures/buildModuleId";
import { test } from "../fixtures/extendedTest";

test("should create css-tagged styles from styled-tagged components", async ({
  expect,
  buildInlineConfig,
  transformResult,
}) => {
  const moduleId = buildModuleId({
    relativePath: "./fixtures/styled.tsx",
    root: import.meta.url,
  });
  await build(buildInlineConfig(moduleId));

  assert(transformResult);
  const { stages } = transformResult[moduleId] ?? {};
  const { ast } = stages?.[1] ?? {};
  assert(ast);
  const { code } = (await transformFromAstAsync(ast)) ?? {};

  assert(code);
  expect(code).not.toMatch(`import { styled } from '@casablanca-css/styled';`);
  expect(code).toMatch("@casablanca-css/core");
  expect(code).not.toMatch("NotExportedComponent = styled");
  expect(code).not.toMatch("${(p) =>}");
  expect(code).toMatch(/\${"var\(--.+\)"}/);
  console.log(code);
});
