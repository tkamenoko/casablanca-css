import type { CssLookupApi } from "../cssLookup";
import type { StageResults } from "./hooks/transform/types";

export type TransformResult = {
  path: string;
  transformed: string;
  cssLookupApi: CssLookupApi;
  stages: StageResults;
};

export type OnExitTransform = (params: TransformResult) => Promise<void>;
