import type { TransformOptions } from '@babel/core';
import type { InlineConfig, ResolvedConfig } from 'vite';

export type PluginOption = {
  babelOptions: TransformOptions;
  internalServerConfig: (c: ResolvedConfig) => InlineConfig;
  extensions: `.${string}`[];
  includes: string[];
};

export const moduleIdPrefix = 'virtual:macrostyles/';
export type ModuleIdPrefix = typeof moduleIdPrefix;
export const resolvedPrefix = '\0';
export type ResolvedPrefix = typeof resolvedPrefix;
export type ResolvedModuleId = `${ResolvedPrefix}${ModuleIdPrefix}${string}`;
