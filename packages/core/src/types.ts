import type { TransformOptions } from '@babel/core';
import type { InlineConfig, ResolvedConfig } from 'vite';

export type PluginOption = {
  babelOptions: TransformOptions;
  internalServerConfig: (c: ResolvedConfig) => InlineConfig;
  extensions: `.${string}`[];
};

export const moduleIdPrefix = 'macrostyles/';
export type ModuleIdPrefix = typeof moduleIdPrefix;
export const resolvedPrefix = '/@resolved/';
export type ResolvedPrefix = typeof resolvedPrefix;
export type ResolvedModuleId = `${ResolvedPrefix}${ModuleIdPrefix}${string}`;
