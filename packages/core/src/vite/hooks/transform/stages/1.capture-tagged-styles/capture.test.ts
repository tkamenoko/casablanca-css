import { transformFromAstAsync } from "@babel/core";
import { build } from "vite";
import { assert } from "vitest";
import { buildModuleId } from "../fixtures/buildModuleId";
import { test } from "../fixtures/extendedTest";

test("should capture variable names initialized with css tag", async ({
  expect,
  buildInlineConfig,
  transformResult,
}) => {
  const moduleId = buildModuleId({
    relativePath: "./fixtures/static.tsx",
    root: import.meta.url,
  });
  await build(buildInlineConfig(moduleId));

  const r = transformResult[moduleId];
  assert(r);
  const { capturedVariableNames, ast, capturedGlobalStylesTempNames } =
    r.stages[1] ?? {};

  expect(capturedGlobalStylesTempNames?.length).toEqual(2);

  assert(capturedVariableNames?.size);
  expect([...capturedVariableNames.entries()]).toMatchObject([
    ["style", { originalName: "style", temporalName: expect.any(String) }],
    [
      "notExported",
      { originalName: "notExported", temporalName: expect.any(String) },
    ],
  ]);

  assert(ast);
  const { code: transformed } = (await transformFromAstAsync(ast)) ?? {};
  assert(transformed);
  expect(transformed).not.toMatch(/{ *css/);
  expect(transformed).not.toMatch(/@casablanca-css\/core/);

  for (const { temporalName } of capturedVariableNames.values()) {
    const regexp = new RegExp(`export const ${temporalName}`);
    expect(transformed).toMatch(regexp);
  }
});
