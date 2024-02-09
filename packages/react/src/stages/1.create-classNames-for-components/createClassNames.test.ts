import { build } from "vite";
import { assert } from "vitest";
import { buildModuleId } from "../fixtures/buildModuleId";
import { test } from "../fixtures/extendedTest";

test("should create css-tagged styles from styled-tagged components", async ({
  expect,
  plugin,
  transformResult,
}) => {
  const moduleId = buildModuleId({
    relativePath: "./fixtures/styled.tsx",
    root: import.meta.url,
  });
  await build({
    configFile: false,
    appType: "custom",
    plugins: [plugin],
    build: {
      write: false,
      lib: { entry: moduleId, formats: ["es"] },
    },
    optimizeDeps: { noDiscovery: true },
  });

  assert(transformResult);
  const { stages } = transformResult[moduleId] ?? {};
  const { code } = stages?.[1] ?? {};
  assert(code);
  expect(code).not.toMatch(`import { styled } from '@macrostyles/react';`);
  expect(code).toMatch("macrostyles/core");
  expect(code).not.toMatch("NotExportedComponent = styled");
  expect(code).not.toMatch("${(p) =>}");
  expect(code).toMatch(/\${"var\(--.+\)"}/);
});
