import type { TransformOptions } from '@babel/core';

export type PluginOption = {
  babelOptions: TransformOptions;
  extensions: `.${string}`[];
};

export type ModuleIdPrefix = 'macrostyles:';
