import { test as t } from "vitest";
import type { TransformResult } from "#@/vite/plugin";
import { plugin as plugin_ } from "#@/vite/plugin";

type TestContext = {
  plugin: ReturnType<typeof plugin_>;
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
  transformResult: async ({ task: _ }, use) => {
    await use({});
  },
});
