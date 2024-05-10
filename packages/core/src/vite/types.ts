import type { TransformOptions } from "vite";
import type { EvaluateOptions } from "./hooks/transform/stages/3.evaluate-module/types";
import type { StageResults } from "./hooks/transform/types";
import type { ResolvedCssModuleId } from "./resolvedCssModuleId";
import type { ResolvedGlobalStyleId } from "./resolvedGlobalStyleId";
import type { VirtualCssModuleId } from "./virtualCssModuleId";
import type { VirtualGlobalStyleId } from "./virtualGlobalStyleId";

export type PluginOption = {
  babelOptions: TransformOptions;
  evaluateOptions: Partial<EvaluateOptions>;
  extensions: `.${string}`[];
  includes: string[];
};

export type TransformResult = {
  path: string;
  transformed: string;
  cssModulesLookup: CssModulesLookup;
  jsToCssModuleLookup: JsToCssModuleLookup;
  globalStylesLookup: GlobalStylesLookup;
  jsToGlobalStyleLookup: JsToGlobalStyleLookup;
  stages: StageResults;
};

export type OnExitTransform = (params: TransformResult) => Promise<void>;

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

export type GlobalStylesLookup = Map<
  ResolvedGlobalStyleId,
  {
    style: string;
    map: string | null;
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
