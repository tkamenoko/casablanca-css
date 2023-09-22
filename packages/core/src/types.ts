import type { TransformOptions } from '@babel/core';
import type { InlineConfig, ResolvedConfig } from 'vite';

export type PluginOption = {
  babelOptions: TransformOptions;
  internalServerConfig: (c: ResolvedConfig) => InlineConfig;
  extensions: `.${string}`[];
};

export type ModuleIdPrefix = 'macrostyles:';
