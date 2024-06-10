import type { InlineConfig } from "vite";
import { test as t } from "vitest";
import { plugin as plugin_ } from "#@/vite/plugin";
import type { TransformResult } from "#@/vite/types";

type TestContext = {
  plugin: ReturnType<typeof plugin_>;
  buildInlineConfig: (moduleId: string) => InlineConfig;
  transformResult: Record<string, TransformResult>;
};

export const test = t.extend<TestContext>({
  plugin: async ({ transformResult }, use) => {
    const plugin = plugin_({
      onExitTransform: async (p) => {
        transformResult[p.id] = p;
      },
    });
    await use(plugin);
  },
  buildInlineConfig: async ({ plugin }, use) => {
    await use((moduleId) => ({
      configFile: false,
      appType: "custom",
      plugins: [plugin],
      build: {
        write: false,
        lib: { entry: moduleId, formats: ["es"] },
      },
      optimizeDeps: { noDiscovery: true },
    }));
  },
  transformResult: async ({ task: _ }, use) => {
    await use({});
  },
});
