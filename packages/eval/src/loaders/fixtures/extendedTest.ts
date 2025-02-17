import nodeExternals from "rollup-plugin-node-externals";
import type { InlineConfig } from "vite";
import { test as t } from "vitest";

type TestContext = {
  buildInlineConfig: (moduleId: string | null) => InlineConfig;
  transformResult: Record<string, string>;
};

export const test = t.extend<TestContext>({
  buildInlineConfig: async ({ transformResult }, use) => {
    await use((moduleId) => ({
      configFile: false,
      appType: "custom",
      plugins: [
        { ...nodeExternals(), enforce: "pre", apply: "build" },
        {
          name: "captureResult",
          enforce: "post",
          transform(code, id) {
            transformResult[id] = code;
          },
        },
      ],
      build: moduleId
        ? {
            write: false,
            lib: { entry: moduleId, formats: ["es"] },
          }
        : {},
      server: {
        middlewareMode: true,
        hmr: false,
        preTransformRequests: false,
      },
      optimizeDeps: { noDiscovery: true },
    }));
  },
  transformResult: async ({ task: _ }, use) => {
    await use({});
  },
});
