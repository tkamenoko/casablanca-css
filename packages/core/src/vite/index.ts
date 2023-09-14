import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import { transformWithEsbuild, createServer } from 'vite';

import { createVirtualCssModule } from '../stages/4.create-virtual-css-module';
import { assignStylesToCapturedVariables } from '../stages/5.assign-styles-to-variables';
import { evaluateModule } from '../stages/3.evaluate-module';
import { captureTaggedStyles } from '../stages/1.capture-tagged-styles';
import type { PluginOption, ModuleIdPrefix } from '../types';

import { isResolvedId } from './isResolvedId';

export function macrostyles(options?: Partial<PluginOption>): Plugin {
  const cssLookup = new Map<`${ModuleIdPrefix}${string}`, string>();

  let config: ResolvedConfig | null = null;
  let server: ViteDevServer | null = null;
  let shouldCloseServer = false;
  const { babelOptions = {}, extensions = ['.js', '.jsx', '.ts', '.tsx'] } =
    options ?? {};

  return {
    name: 'macrostyles',
    async transform(code, id) {
      if (!config) {
        throw new Error('Vite config is not resolved');
      }
      if (!server) {
        throw new Error('Vite dev server is not running');
      }
      const serverResolved = server;

      if (!extensions.some((e) => id.endsWith(e))) {
        // ignore module that is not JS/TS code
        return;
      }
      if (/\/node_modules\//.test(id)) {
        // ignore third party packages
        return;
      }

      let targetCode = code;
      if (this.meta.watchMode) {
        const m = server.moduleGraph.getModuleById(id);
        if (!m) {
          return;
        }
        const r = await server.ssrLoadModule(`${m.url}?raw`);
        // eslint-disable-next-line @typescript-eslint/dot-notation, @typescript-eslint/prefer-optional-chain
        const raw = r['default'];
        if (!raw) {
          return;
        }
        const c = await transformWithEsbuild(raw, id, {
          format: 'esm',
          platform: 'node',
        });
        targetCode = c.code;
      }

      // find tagged templates, then remove all tags.
      const { capturedVariableNames, transformed: capturedCode } =
        captureTaggedStyles({ code: targetCode, options: { babelOptions } });
      if (!capturedVariableNames.length) {
        return;
      }

      const { mapOfVariableNamesToStyles } = await evaluateModule({
        code: capturedCode,
        variableNames: capturedVariableNames,
        moduleId: id,
        load: async (id) => {
          const result = await serverResolved.ssrLoadModule(id);
          return result;
        },
        resolveId: async (id) => {
          const r = await this.resolve(id);
          if (!r) {
            return r;
          }
          return r.id;
        },
      });

      const { importId, style } = createVirtualCssModule({
        evaluatedStyles: Array.from(mapOfVariableNamesToStyles.values()),
        importerId: id,
        projectRoot: config.root,
      });

      const { transformed: resultCode } = assignStylesToCapturedVariables({
        variableNames: capturedVariableNames,
        code: capturedCode,
        cssImportId: importId,
        options: { babelOptions },
      });

      cssLookup.set(importId, style);
      const createdCssModule = server.moduleGraph.getModuleById(importId);
      if (createdCssModule) {
        server.moduleGraph.invalidateModule(createdCssModule);
      }

      return resultCode;
    },

    configResolved(config_) {
      config = config_;
    },
    configureServer(server_) {
      server = server_;
    },
    async buildStart() {
      if (!config) {
        throw new Error('Vite config is not resolved');
      }

      if (config.command === 'build' && !shouldCloseServer) {
        shouldCloseServer = true;
        const {
          configFile: _unused,
          plugins,
          assetsInclude: __unused,
          ...rest
        } = config;

        server = await createServer({
          ...rest,
          plugins: plugins.slice(),
          appType: 'custom',
          server: { middlewareMode: true, hmr: false },
        });
      }
    },
    async buildEnd() {
      if (shouldCloseServer) {
        shouldCloseServer = false;
        await server?.close();
      }
    },
    resolveId(id) {
      if (isResolvedId(id)) {
        return id;
      }
      return null;
    },
    load(id) {
      const normalizedId = id.replace(/\?.*/, '');
      if (!isResolvedId(normalizedId)) {
        return;
      }

      const found = cssLookup.get(normalizedId);

      return found;
    },
  };
}
