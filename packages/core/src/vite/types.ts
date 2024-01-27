import type { TransformOptions } from 'vite';

export type PluginOption = {
  babelOptions: TransformOptions;
  extensions: `.${string}`[];
  includes: string[];
};

export const moduleIdPrefix = 'virtual:macrostyles/';
export type ModuleIdPrefix = typeof moduleIdPrefix;

export type VirtualCssModuleId = `${ModuleIdPrefix}${string}.module.css`;
export type ResolvedCssModuleId = `\0${VirtualCssModuleId}`;
export type CssModulesLookup = Map<
  ResolvedCssModuleId,
  {
    style: string;
    classNameToStyleMap: Map<string, { style: string }>;
  }
>;
export type JsToCssModuleLookup = Map<
  string,
  {
    virtualId: VirtualCssModuleId;
    resolvedId: ResolvedCssModuleId;
    style: string;
  }
>;
