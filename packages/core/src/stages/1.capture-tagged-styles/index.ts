import type { types } from '@babel/core';
import { transformFromAstAsync } from '@babel/core';

import type { ImportSource, Options } from './types';
import { captureVariableNamesPlugin } from './captureVariables';
import { removeImportsPlugin } from './removeImports';

type CaptureTaggedStylesArgs = {
  code: string;
  ast: types.File;
  isDev: boolean;
};

export type CapturedVariableNames = Map<
  string,
  { originalName: string; temporalName: string }
>;

export type CaptureTaggedStylesReturn = {
  transformed: string;
  ast: types.File;
  capturedVariableNames: CapturedVariableNames;
  importSources: ImportSource[];
};

// find tagged templates, then remove all tags.
// enforce variables to export.
export async function captureTaggedStyles({
  code,
  ast,
  isDev,
}: CaptureTaggedStylesArgs): Promise<CaptureTaggedStylesReturn> {
  const pluginOption: Options = {
    capturedVariableNames: new Map(),
    importSources: [],
  };
  const result = await transformFromAstAsync(ast, code, {
    plugins: [
      [captureVariableNamesPlugin, pluginOption],
      [removeImportsPlugin, pluginOption],
    ],
    sourceMaps: isDev ? 'inline' : false,
    ast: true,
  });
  if (!result) {
    throw new Error('Failed');
  }
  const { code: transformed, ast: capturedAst } = result;
  if (!(transformed && capturedAst)) {
    throw new Error('Failed');
  }
  return {
    capturedVariableNames: pluginOption.capturedVariableNames,
    transformed,
    ast: capturedAst,
    importSources: pluginOption.importSources,
  };
}
