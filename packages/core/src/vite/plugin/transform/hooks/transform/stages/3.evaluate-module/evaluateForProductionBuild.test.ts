import { build } from "vite";
import { assert } from "vitest";
import { buildModuleId } from "../fixtures/buildModuleId";
import { test } from "../fixtures/extendedTest";
import * as globalStyleModuleExports from "./fixtures/globalStyles";
import { testObjectHasEvaluatedStyles } from "./fixtures/testHelpers";
import * as thirdPartyModuleExports from "./fixtures/thirdParty";
import * as assetModuleExports from "./fixtures/useAssetFile";
import * as localModuleExports from "./fixtures/useLocalFile";

test("should evaluate module to get exported styles", async ({
  expect,
  buildInlineConfig,
  transformResult,
}) => {
  const variableNames = ["staticStyle", "embedded", "functionCall"] as const;
  const moduleId = buildModuleId({
    relativePath: "./fixtures/simple.ts",
    root: import.meta.url,
  });

  await build(buildInlineConfig(moduleId));

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
  buildInlineConfig,
  transformResult,
}) => {
  const variableNames = ["styleWithOpenProps"] as const;
  const moduleId = buildModuleId({
    relativePath: "./fixtures/thirdParty.ts",
    root: import.meta.url,
  });
  await build(buildInlineConfig(moduleId));

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
  buildInlineConfig,
  transformResult,
}) => {
  const variableNames = ["styleWithLocalModule"] as const;
  const moduleId = buildModuleId({
    relativePath: "./fixtures/useLocalFile.ts",
    root: import.meta.url,
  });

  await build(buildInlineConfig(moduleId));

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
  buildInlineConfig,
  transformResult,
}) => {
  const variableNames = ["className"] as const;
  const moduleId = buildModuleId({
    relativePath: "./fixtures/useAssetFile.ts",
    root: import.meta.url,
  });

  await build(buildInlineConfig(moduleId));

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
  buildInlineConfig,
  transformResult,
}) => {
  const variableNames = ["staticStyle"] as const;
  const moduleId = buildModuleId({
    relativePath: "./fixtures/globalStyles.ts",
    root: import.meta.url,
  });

  await build(buildInlineConfig(moduleId));

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
