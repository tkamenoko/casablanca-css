import type { SourceMap } from "@ampproject/remapping";
import type { TransformOptions } from "vite";

export type PluginOption = {
  babelOptions: TransformOptions;
  extensions: `.${string}`[];
  includes: string[];
};

export const cssModuleIdPrefix = "virtual:casablanca-modules/";
export type CssModuleIdPrefix = typeof cssModuleIdPrefix;
export type VirtualCssModuleId = `${CssModuleIdPrefix}${string}.module.css`;
export type ResolvedCssModuleId = `\0${VirtualCssModuleId}`;
export type CssModulesLookup = Map<
  ResolvedCssModuleId,
  {
    style: string;
    map: SourceMap | null;
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

export const globalStyleIdPrefix = "virtual:casablanca-globals/";
export type GlobalStyleIdPrefix = typeof globalStyleIdPrefix;
export type VirtualGlobalStyleId = `${GlobalStyleIdPrefix}${string}.css`;
export type ResolvedGlobalStyleId = `\0${VirtualGlobalStyleId}`;
export type GlobalStylesLookup = Map<
  ResolvedGlobalStyleId,
  {
    style: string;
  }
>;
export type JsToGlobalStyleLookup = Map<
  string,
  {
    virtualId: VirtualGlobalStyleId;
    resolvedId: ResolvedGlobalStyleId;
    style: string;
  }
>;
