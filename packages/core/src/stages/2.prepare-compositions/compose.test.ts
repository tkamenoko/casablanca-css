import { build } from "vite";
import { assert } from "vitest";
import { buildModuleId } from "../fixtures/buildModuleId";
import { test } from "../fixtures/extendedTest";

test("should replace `compose: ...` with uuid", async ({
  expect,
  plugin,
  transformResult,
}) => {
  const moduleId = buildModuleId({
    relativePath: "./fixtures/composing.ts",
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

  const r = transformResult[moduleId];
  assert(r);

  const { transformed } = r.stages[2] ?? {};
  assert(transformed);
  expect(transformed).not.toMatch(/compose:/);
  expect(transformed).toMatch(
    /([0-9a-f]{8})-([0-9a-f]{4})-(4[0-9a-f]{3})-([0-9a-f]{4})-([0-9a-f]{12})/,
  );
});
