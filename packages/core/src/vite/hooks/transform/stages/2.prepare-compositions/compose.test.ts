import { transformFromAstAsync } from "@babel/core";
import { build } from "vite";
import { assert } from "vitest";
import { buildModuleId } from "../fixtures/buildModuleId";
import { test } from "../fixtures/extendedTest";

test("should replace `compose: ...` with uuid", async ({
  expect,
  buildInlineConfig,
  transformResult,
}) => {
  const moduleId = buildModuleId({
    relativePath: "./fixtures/composing.ts",
    root: import.meta.url,
  });
  await build(buildInlineConfig(moduleId));

  const r = transformResult[moduleId];
  assert(r);

  const { ast } = r.stages[2] ?? {};
  assert(ast);
  const { code: transformed } = (await transformFromAstAsync(ast)) ?? {};

  assert(transformed);
  expect(transformed).not.toMatch(/compose:/);
  expect(transformed).toMatch(
    /([0-9a-f]{8})-([0-9a-f]{4})-(4[0-9a-f]{3})-([0-9a-f]{4})-([0-9a-f]{12})/,
  );
});
