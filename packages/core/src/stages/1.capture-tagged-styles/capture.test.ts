import {
  createServer,
  type Plugin,
  type ResolvedConfig,
  type ViteDevServer,
} from 'vite';
import { assert, beforeEach, test } from 'vitest';

import { isResolvedId } from '../../vite/isResolvedId';
import type { ModuleIdPrefix, PluginOption } from '../../types';
import { buildModuleId } from '../fixtures/buildModuleId';

import { captureTaggedStyles } from '.';

function partialPlugin(
  options?: Partial<PluginOption> & {
    capturedVariableNames: string[];
  }
): Plugin {
  const cssLookup = new Map<`${ModuleIdPrefix}${string}`, string>();

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
        // ignore module that is not JS/TS code
        return;
      }
      if (/\/node_modules\//.test(id)) {
        // ignore third party packages
        return;
      }

      // find tagged templates, then remove all tags.
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
    resolveId(id) {
      if (isResolvedId(id)) {
        return id;
      }
      return null;
    },
    load(id) {
      if (!isResolvedId(id)) {
        return;
      }
      const found = cssLookup.get(id);
      return found;
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
      partialPlugin({ capturedVariableNames: ctx.capturedVariableNames }),
    ],
  });

  ctx.server = await server.listen();
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
