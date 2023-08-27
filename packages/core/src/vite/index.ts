import type { Plugin, ResolvedConfig } from 'vite';

import { createVirtualCssModule } from '../stages/4.create-virtual-css-module';
import { assignStylesToCapturedVariables } from '../stages/5.assign-styles-to-variables';
import { evaluateModule } from '../stages/3.evaluate-module';
import { captureTaggedStyles } from '../stages/1.capture-tagged-styles';
import type { PluginOption, ModuleIdPrefix } from '../types';

import { isResolvedId } from './isResolvedId';

export function macrostyles(options?: Partial<PluginOption>): Plugin {
  const cssLookup = new Map<`${ModuleIdPrefix}${string}`, string>();

  let config: ResolvedConfig | null = null;
  const { babelOptions = {}, extensions = ['.js', '.jsx', '.ts', '.tsx'] } =
    options ?? {};

  return {
    name: 'macrostyles',
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

      // TODO: processComposition

      const { mapOfVariableNamesToStyles } = await evaluateModule({
        code: capturedCode,
        variableNames: capturedVariableNames,
        moduleId: id,
        load: async (id) => {
          const { code } = await this.load({ id, resolveDependencies: true });
          if (!code) {
            throw new Error('LoadingError');
          }
          return code;
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

      cssLookup.set(`${importId}`, style);

      return resultCode;
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
