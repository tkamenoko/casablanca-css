import type { TransformOptions } from "vite";
import type { ResolvedCssModuleId } from "./resolvedCssModuleId";
import type { VirtualCssModuleId } from "./virtualCssModuleId";
import type { VirtualGlobalStyleId } from "./virtualGlobalStyleId";

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
