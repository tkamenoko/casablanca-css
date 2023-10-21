import type { TransformOptions } from 'vite';

export type PluginOption = {
  babelOptions: TransformOptions;
  extensions: `.${string}`[];
  includes: string[];
};

export const moduleIdPrefix = 'virtual:macrostyles/';
export type ModuleIdPrefix = typeof moduleIdPrefix;
export type VirtualModuleId = `${ModuleIdPrefix}${string}`;
export type ResolvedModuleId = `\0${VirtualModuleId}`;

export type CssLookup = Map<
  ResolvedModuleId,
  {
    style: string;
    classNameToStyleMap: Map<string, { style: string }>;
  }
>;

export type JsToCssLookup = Map<
  string,
  {
    virtualId: VirtualModuleId;
    resolvedId: ResolvedModuleId;
    style: string;
  }
>;
