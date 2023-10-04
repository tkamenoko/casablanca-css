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
export type VirtualModuleId = `${ModuleIdPrefix}${string}`;

export type ResolvedModuleId = `\0${VirtualModuleId}`;

export type TaggedStyle<T> = T & {
  __tagged: never;
};
