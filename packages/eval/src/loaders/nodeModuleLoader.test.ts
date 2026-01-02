import { build, createServer, type ViteDevServer } from "vite";
import { assert } from "vitest";
import { evaluate } from "..";
import { buildModuleId } from "./fixtures/buildModuleId";
import { test as t } from "./fixtures/extendedTest";
import * as nodeModulesExports from "./fixtures/importNodeModules";
import { nodeBuiltinLoader } from "./nodeBuiltinLoader";
import { nodeModuleLoader } from "./nodeModuleLoader";

type TestContext = {
  server: ViteDevServer;
};

const test = t.extend<TestContext>({
  server: async ({ buildInlineConfig }, use) => {
    const server = await createServer(buildInlineConfig(null));
    await use(server);
    await server.close();
  },
});

test("should evaluate code using node modules", async ({
  expect,
  transformResult,
  buildInlineConfig,
}) => {
  const moduleId = buildModuleId({
    relativePath: "./fixtures/importNodeModules.ts",
    root: import.meta.url,
  });
  await build(buildInlineConfig(moduleId));
  const transformed = transformResult[moduleId];
  assert(transformed);

  const evaluated = await evaluate({
    code: transformed,
    loaders: [nodeBuiltinLoader, nodeModuleLoader],
    modulePath: moduleId,
  });
  const fontSize = evaluated["fontSize"];
  expect(fontSize).toBeTypeOf("string");
  expect(fontSize).toEqual(nodeModulesExports.fontSize);
});
