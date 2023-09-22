import {
  createServer,
  type Plugin,
  type ResolvedConfig,
  type ViteDevServer,
} from 'vite';
import { assert, beforeEach, test } from 'vitest';

import type { PluginOption } from '../../types';
import { buildModuleId } from '../fixtures/buildModuleId';

import { captureTaggedStyles } from '.';

function partialPlugin(
  options?: Partial<PluginOption> & {
    capturedVariableNames: string[];
  },
): Plugin {
  let config: ResolvedConfig | null = null;
  const { babelOptions = {}, extensions = ['.js', '.jsx', '.ts', '.tsx'] } =
    options ?? {};
  return {
    name: 'macrostyles:partial',
    async transform(code, id) {
      if (!config) {
        throw new Error('Vite config is not resolved');
      }
      if (!extensions.some((e) => id.endsWith(e))) {
        return;
      }
      if (/\/node_modules\//.test(id)) {
        return;
      }
      const { capturedVariableNames, transformed: capturedCode } =
        captureTaggedStyles({ code, options: { babelOptions } });
      if (!capturedVariableNames.length) {
        return;
      }
      options?.capturedVariableNames.push(...capturedVariableNames);
      return capturedCode;
    },

    configResolved(config_) {
      config = config_;
    },
  };
}

type TestContext = {
  server: ViteDevServer;
  capturedVariableNames: string[];
};

beforeEach<TestContext>(async (ctx) => {
  ctx.capturedVariableNames = [];
  const server = await createServer({
    plugins: [
      partialPlugin({
        capturedVariableNames: ctx.capturedVariableNames,
      }),
    ],
    appType: 'custom',
    server: {
      middlewareMode: true,
      hmr: false,
    },
    optimizeDeps: {
      disabled: true,
    },
  });

  ctx.server = server;
  return async () => {
    await ctx.server.close();
  };
});

test<TestContext>('should capture variable names initialized with css tag', async ({
  capturedVariableNames,
  expect,
  server,
}) => {
  const moduleId = buildModuleId({
    relativePath: './fixtures/static.tsx',
    root: import.meta.url,
  });
  const result = await server.transformRequest(moduleId);
  assert(result);

  expect(capturedVariableNames).toEqual(['style', 'notExported']);
  const transformed = result.code;
  expect(transformed).not.toMatch(/css/);
  expect(transformed).not.toMatch(/@macrostyles\/core/);

  for (const capturedVariableName of capturedVariableNames) {
    const regexp = new RegExp(`export .+ ${capturedVariableName}`);
    expect(transformed).toMatch(regexp);
  }
});
