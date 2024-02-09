import { type ViteDevServer, createServer } from "vite";
import { assert, test as t } from "vitest";
import { type TransformResult, plugin } from "#@/vite/plugin";
import { buildModuleId } from "../fixtures/buildModuleId";
import * as globalStyleModuleExports from "./fixtures/globalStyles";
import { testObjectHasEvaluatedStyles } from "./fixtures/testHelpers";
import * as thirdPartyModuleExports from "./fixtures/thirdParty";
import * as assetModuleExports from "./fixtures/useAssetFile";
import * as localModuleExports from "./fixtures/useLocalFile";

type TestContext = {
  server: ViteDevServer;
  transformResult: Record<string, TransformResult>;
};

const test = t.extend<TestContext>({
  server: async ({ transformResult }, use) => {
    const server = await createServer({
      plugins: [
        plugin({
          onExitTransform: async (p) => {
            transformResult[p.id] = p;
          },
        }),
      ],
      appType: "custom",
      server: {
        middlewareMode: true,
        hmr: false,
        preTransformRequests: false,
      },
      configFile: false,
      optimizeDeps: {
        noDiscovery: true,
      },
    });
    await use(server);
    await server.close();
  },
  transformResult: async ({ task: _ }, use) => {
    await use({});
  },
});

test("should evaluate module to get exported styles", async ({
  expect,
  transformResult,
  server,
}) => {
  const variableNames = ["staticStyle", "embedded", "functionCall"] as const;
  const moduleId = buildModuleId({
    relativePath: "./fixtures/simple.ts",
    root: import.meta.url,
  });

  const result = await server.transformRequest(moduleId);
  assert(result);

  const r = transformResult[moduleId];
  assert(r);
  const { mapOfClassNamesToStyles } = r.stages[3] ?? {};
  assert(mapOfClassNamesToStyles);

  testObjectHasEvaluatedStyles({
    expect,
    mapOfClassNamesToStyles,
    moduleExports: {
      staticStyle: `
  color: blue;
`,
      embedded: `
  font-size: ${4}em;
`,
      functionCall: `
  font-weight: ${"bold"};
`,
    },
    variableNames,
  });
});

test("should evaluate module using third party modules", async ({
  expect,
  server,
  transformResult,
}) => {
  const variableNames = ["styleWithPolished"] as const;
  const moduleId = buildModuleId({
    relativePath: "./fixtures/thirdParty.ts",
    root: import.meta.url,
  });

  const result = await server.transformRequest(moduleId);
  assert(result);

  const r = transformResult[moduleId];
  assert(r);
  const { mapOfClassNamesToStyles } = r.stages[3] ?? {};
  assert(mapOfClassNamesToStyles);

  testObjectHasEvaluatedStyles({
    expect,
    mapOfClassNamesToStyles,
    moduleExports: thirdPartyModuleExports,
    variableNames,
  });
});

test("should evaluate module using local modules", async ({
  expect,
  server,
  transformResult,
}) => {
  const variableNames = ["styleWithLocalModule"] as const;
  const moduleId = buildModuleId({
    relativePath: "./fixtures/useLocalFile.ts",
    root: import.meta.url,
  });

  const result = await server.transformRequest(moduleId);
  assert(result);

  const r = transformResult[moduleId];
  assert(r);
  const { mapOfClassNamesToStyles } = r.stages[3] ?? {};
  assert(mapOfClassNamesToStyles);

  testObjectHasEvaluatedStyles({
    expect,
    mapOfClassNamesToStyles,
    moduleExports: localModuleExports,
    variableNames,
  });
});

test("should evaluate module using non-script modules", async ({
  expect,
  server,
  transformResult,
}) => {
  const variableNames = ["className"] as const;
  const moduleId = buildModuleId({
    relativePath: "./fixtures/useAssetFile.ts",
    root: import.meta.url,
  });

  const result = await server.transformRequest(moduleId);
  assert(result);

  const r = transformResult[moduleId];
  assert(r);
  const { mapOfClassNamesToStyles } = r.stages[3] ?? {};
  assert(mapOfClassNamesToStyles);

  testObjectHasEvaluatedStyles({
    expect,
    mapOfClassNamesToStyles,
    moduleExports: assetModuleExports,
    variableNames,
  });
});

test("should evaluate module injecting global styles", async ({
  expect,
  server,
  transformResult,
}) => {
  const variableNames = ["staticStyle"] as const;
  const moduleId = buildModuleId({
    relativePath: "./fixtures/globalStyles.ts",
    root: import.meta.url,
  });

  const result = await server.transformRequest(moduleId);
  assert(result);

  const r = transformResult[moduleId];
  assert(r);
  const { mapOfClassNamesToStyles, evaluatedGlobalStyles } = r.stages[3] ?? {};
  assert(mapOfClassNamesToStyles && evaluatedGlobalStyles);

  expect(evaluatedGlobalStyles.at(0)).toMatch("body {");

  testObjectHasEvaluatedStyles({
    expect,
    mapOfClassNamesToStyles,
    moduleExports: globalStyleModuleExports,
    variableNames,
  });
});
