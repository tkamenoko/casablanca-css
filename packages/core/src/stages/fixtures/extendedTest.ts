import { test as t } from "vitest";
import { plugin as plugin_ } from "#@/vite/plugin";
import type { TransformResult } from "#@/vite/types";

type TestContext = {
  plugin: ReturnType<typeof plugin_>;
  transformResult: Record<string, TransformResult>;
};

export const test = t.extend<TestContext>({
  plugin: async ({ transformResult }, use) => {
    const plugin = plugin_({
      onExitTransform: async (p) => {
        transformResult[p.path] = p;
      },
    });
    await use(plugin);
  },
  transformResult: async ({ task: _ }, use) => {
    await use({});
  },
});
