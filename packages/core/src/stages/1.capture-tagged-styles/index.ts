import type { TransformOptions } from '@babel/core';
import { transformSync } from '@babel/core';

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
  capturedVariableNames: CapturedVariableNames;
  importSources: ImportSource[];
};

// find tagged templates, then remove all tags.
// enforce variables to export.
export function captureTaggedStyles({
  code,
  options,
}: CaptureTaggedStylesArgs): CaptureTaggedStylesReturn {
  const { babelOptions } = options ?? {};
  const pluginOption: Options = {
    capturedVariableNames: new Map(),
    exportedNames: [],
    importSources: [],
  };
  const result = transformSync(code, {
    ...babelOptions,
    plugins: [[captureVariableNamesPlugin, pluginOption]],
    sourceMaps: 'inline',
  });
  if (!result) {
    throw new Error('Failed');
  }
  const { code: transformed } = result;
  if (!transformed) {
    throw new Error('Failed');
  }
  return {
    capturedVariableNames: pluginOption.capturedVariableNames,
    transformed,
    importSources: pluginOption.importSources,
  };
}
