import type { Plugin, ViteDevServer } from 'vite';

import { createVirtualCssModule } from '../stages/4.create-virtual-css-module';
import { assignStylesToCapturedVariables } from '../stages/5.assign-styles-to-variables';
import { evaluateModule } from '../stages/3.evaluate-module';
import { captureTaggedStyles } from '../stages/1.capture-tagged-styles';
import type { PluginOption, ModuleIdPrefix } from '../types';

const moduleIdPrefix: ModuleIdPrefix = 'macrostyles:';

function isResolverId(p: string): p is `${ModuleIdPrefix}${string}` {
  return p.startsWith(moduleIdPrefix);
}

export function macrostyles(options: PluginOption): Plugin {
  const cssLookup = new Map<`${ModuleIdPrefix}${string}`, string>();

  let server: ViteDevServer | null = null;
  return {
    name: 'macrostyles',
    async transform(code, id) {
      if (!server) {
        throw new Error('Vite server is not configured');
      }
      if (/\/node_modules\//.test(id)) {
        // ignore third party packages
        return;
      }

      const { babelOptions } = options;
      // find tagged templates, then remove all tags.
      const { capturedVariableNames, transformed: capturedCode } =
        captureTaggedStyles({ code, options: { babelOptions } });
      if (!capturedVariableNames.length) {
        return;
      }

      // TODO: processComposition

      const { mapOfVariableNamesToStyles } = await evaluateModule({
        code: capturedCode,
        moduleId: id,
        variableNames: capturedVariableNames,
        moduleGraph: server.moduleGraph,
      });

      const { importId, style } = createVirtualCssModule({
        evaluatedStyles: Array.from(mapOfVariableNamesToStyles.values()),
        importerId: id,
        projectRoot: server.config.root,
      });

      const { transformed: resultCode } = assignStylesToCapturedVariables({
        variableNames: capturedVariableNames,
        code: capturedCode,
        cssImportId: importId,
        options: { babelOptions },
      });

      cssLookup.set(`${importId}`, style);

      return resultCode;
    },
    configureServer(server_) {
      server = server_;
    },
    resolveId(id) {
      if (id.startsWith(moduleIdPrefix)) {
        return `${id}`;
      }
      return null;
    },
    load(id) {
      if (!isResolverId(id)) {
        return;
      }
      const found = cssLookup.get(id);
      return found;
    },
  };
}
