import type { TransformOptions, types } from '@babel/core';
import { transformAsync } from '@babel/core';

import type { ImportSource, Options } from './captureVariables';
import { captureVariableNamesPlugin } from './captureVariables';

type CaptureTaggedStylesArgs = {
  code: string;
  options?: {
    babelOptions: TransformOptions;
  };
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
  options,
}: CaptureTaggedStylesArgs): Promise<CaptureTaggedStylesReturn> {
  const { babelOptions } = options ?? {};
  const pluginOption: Options = {
    capturedVariableNames: new Map(),
    exportedNames: [],
    importSources: [],
  };
  const result = await transformAsync(code, {
    ...babelOptions,
    plugins: [[captureVariableNamesPlugin, pluginOption]],
    sourceMaps: 'inline',
    ast: true,
  });
  if (!result) {
    throw new Error('Failed');
  }
  const { code: transformed, ast } = result;
  if (!(transformed && ast)) {
    throw new Error('Failed');
  }
  return {
    capturedVariableNames: pluginOption.capturedVariableNames,
    transformed,
    ast,
    importSources: pluginOption.importSources,
  };
}
