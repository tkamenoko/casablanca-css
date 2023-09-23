import type { TransformOptions } from '@babel/core';
import type { InlineConfig, ResolvedConfig } from 'vite';

export type PluginOption = {
  babelOptions: TransformOptions;
  internalServerConfig: (c: ResolvedConfig) => InlineConfig;
  extensions: `.${string}`[];
};

export const moduleIdPrefix = 'virtual:macrostyles/';
export type ModuleIdPrefix = typeof moduleIdPrefix;

export type ResolvedModuleId = `\0${ModuleIdPrefix}${string}`;
