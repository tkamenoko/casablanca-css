import type { types } from "@babel/core";
import type { Plugin } from "vite";
import type { CapturedVariableNames } from "../1.capture-tagged-styles/types";
import type { UuidToStylesMap } from "../2.prepare-compositions/types";

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

export type EvaluateOptions = {
  importMeta: Record<string, unknown>;
  globals: Record<string, unknown>;
};

export type Evaluator = (args: {
  ast: types.File;
  uuidToStylesMap: UuidToStylesMap;
  capturedVariableNames: CapturedVariableNames;
  temporalGlobalStyles: string[];
}) => Promise<EvaluateModuleReturn>;

export type TransformContext = ThisParameterType<
  Exclude<NonNullable<Plugin["transform"]>, { order?: unknown }>
>;
