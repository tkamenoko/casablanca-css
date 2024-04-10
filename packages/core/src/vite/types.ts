import type { TransformOptions } from "vite";
import type { VirtualCssModuleId } from "./cssModuleId";
import type { ResolvedCssModuleId } from "./resolvedCssModuleId";

export type PluginOption = {
  babelOptions: TransformOptions;
  extensions: `.${string}`[];
  includes: string[];
};

export type CssModulesLookup = Map<
  ResolvedCssModuleId,
  {
    style: string;
    map: string | null;
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
