import type { TransformOptions } from "vite";
import type { EvaluateOptions } from "./plugin/transform/hooks/transform/stages/3.evaluate-module/types";

export type PluginOption = {
  babelOptions: TransformOptions;
  evaluateOptions: Partial<EvaluateOptions>;
  extensions: `.${string}`[];
  includes: string[];
};
