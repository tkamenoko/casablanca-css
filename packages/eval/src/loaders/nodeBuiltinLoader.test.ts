import { build } from "vite";
import { assert } from "vitest";
import { evaluate } from "..";
import { buildModuleId } from "./fixtures/buildModuleId";
import { test } from "./fixtures/extendedTest";
import * as nodeBuiltinExports from "./fixtures/importNodeBuiltin";
import { nodeBuiltinLoader } from "./nodeBuiltinLoader";

test("should evaluate code using node builtin modules", async ({
  expect,
  transformResult,
  buildInlineConfig,
}) => {
  const moduleId = buildModuleId({
    relativePath: "./fixtures/importNodeBuiltin.ts",
    root: import.meta.url,
  });
  await build(buildInlineConfig(moduleId));
  const transformed = transformResult[moduleId];
  assert(transformed);

  const evaluated = await evaluate({
    code: transformed,
    loaders: [nodeBuiltinLoader],
    modulePath: moduleId,
  });
  const uuid = evaluated["uuid"];
  expect(uuid).toBeTypeOf("string");
  expect(uuid).not.toEqual(nodeBuiltinExports.uuid);
});
