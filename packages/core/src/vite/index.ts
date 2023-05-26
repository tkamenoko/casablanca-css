import type { TransformOptions } from '@babel/core';
import type { Plugin, ViteDevServer } from 'vite';

import { createVirtualCssModule } from '../stages/4.create-virtual-css-module';
import { assignStylesToCapturedVariables } from '../stages/5.assign-styles-to-variables';
import { evaluateModule } from '../stages/3.evaluate-module';
import { captureTaggedStyles } from '../stages/1.capture-tagged-styles';
import type { PluginOption, VirtualModuleIdPrefix } from '../types';

type ResolvedVirtualModuleIdPrefix = `\0${VirtualModuleIdPrefix}`;
const virtualModuleIdPrefix: VirtualModuleIdPrefix = 'virtual:macrostyles';
const resolvedVirtualModuleIdPrefix: ResolvedVirtualModuleIdPrefix =
  '\0virtual:macrostyles';

function isResolverId(
  p: string
): p is `${ResolvedVirtualModuleIdPrefix}${string}` {
  return p.startsWith(resolvedVirtualModuleIdPrefix);
}

export function macrostyles(options: PluginOption): Plugin {
  const virtualModuleIdPrefix: VirtualModuleIdPrefix = 'virtual:macrostyles';
  const resolvedVirtualModuleIdPrefix: ResolvedVirtualModuleIdPrefix =
    '\0virtual:macrostyles';

  const cache = new Map<string, Record<string, string>>();
  // TODO: handle module dependencies?
  const cssLookup = new Map<
    `${ResolvedVirtualModuleIdPrefix}${string}`,
    string
  >();

  type ProcessedClassName = string;
  type RawClassName = string;
  const rawClassNamesLookup = new Map<ProcessedClassName, RawClassName>();

  let server: ViteDevServer | null = null;
  return {
    name: 'macrostyles',
    async transform(code, id) {
      if (!server) {
        throw new Error('Vite server is not configured');
      }
      // TODO: if file is not changed, return cached content

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
      });

      cssLookup.set(`\0${importId}`, style);

      return resultCode;
    },
    configureServer(server_) {
      server = server_;
    },
    resolveId(id) {
      if (id.startsWith(virtualModuleIdPrefix)) {
        return `\0${id}`;
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
    handleHotUpdate(ctx) {
      // TODO: reset cache based on timestamp
    },
  };
}
