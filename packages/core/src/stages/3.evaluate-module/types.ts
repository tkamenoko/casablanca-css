import type { Plugin } from "vite";

type VariableName = string;

export type EvaluateModuleReturn = {
  mapOfClassNamesToStyles: Map<
    VariableName,
    {
      temporalVariableName: string;
      originalName: string;
      style: string;
    }
  >;
  evaluatedGlobalStyles: string[];
};
export type TransformContext = ThisParameterType<
  Exclude<NonNullable<Plugin["transform"]>, { order?: unknown }>
>;
