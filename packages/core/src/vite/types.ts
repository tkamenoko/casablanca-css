import type { TransformOptions } from "vite";
import type { CaptureTaggedStylesReturn } from "#@/stages/1.capture-tagged-styles";
import type { PrepareCompositionsReturn } from "#@/stages/2.prepare-compositions";
import type { EvaluateModuleReturn } from "#@/stages/3.evaluate-module";
import type { ReplaceUuidToStylesReturn } from "#@/stages/4.assign-composed-styles-to-uuid";
import type { CreateVirtualModulesReturn } from "#@/stages/5.create-virtual-modules";
import type { AssignStylesToCapturedVariablesReturn } from "#@/stages/6.assign-styles-to-variables";
import type { ResolvedCssModuleId } from "./resolvedCssModuleId";
import type { ResolvedGlobalStyleId } from "./resolvedGlobalStyleId";
import type { VirtualCssModuleId } from "./virtualCssModuleId";
import type { VirtualGlobalStyleId } from "./virtualGlobalStyleId";

export type PluginOption = {
  babelOptions: TransformOptions;
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
  stages: {
    1?: CaptureTaggedStylesReturn;
    2?: PrepareCompositionsReturn;
    3?: EvaluateModuleReturn;
    4?: ReplaceUuidToStylesReturn;
    5?: CreateVirtualModulesReturn;
    6?: AssignStylesToCapturedVariablesReturn;
  };
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
