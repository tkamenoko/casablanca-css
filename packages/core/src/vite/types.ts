import type { TransformOptions } from "vite";
import type { CssLookupApi } from "./plugin/cssLookup";
import type { EvaluateOptions } from "./plugin/transform/hooks/transform/stages/3.evaluate-module/types";
import type { StageResults } from "./plugin/transform/hooks/transform/types";

export type PluginOption = {
  babelOptions: TransformOptions;
  evaluateOptions: Partial<EvaluateOptions>;
  extensions: `.${string}`[];
  includes: string[];
};

export type TransformResult = {
  path: string;
  transformed: string;
  cssLookupApi: CssLookupApi;
  stages: StageResults;
};

export type OnExitTransform = (params: TransformResult) => Promise<void>;
