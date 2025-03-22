import type { CapturedVariableNames } from "../1.capture-tagged-styles/types";
import type { EvaluateModuleReturn } from "./types";

export function collectEvaluatedStyles({
  evaluatedNamespace,
  capturedVariableNames,
  temporalGlobalStyles,
}: {
  capturedVariableNames: CapturedVariableNames;
  temporalGlobalStyles: string[];
  evaluatedNamespace: Record<string, unknown>;
}): EvaluateModuleReturn {
  const mapOfClassNamesToStyles: EvaluateModuleReturn["mapOfClassNamesToStyles"] =
    new Map();
  for (const { originalName, temporalName } of capturedVariableNames.values()) {
    const style = evaluatedNamespace[temporalName];
    if (typeof style !== "string") {
      throw new Error(`Failed to capture variable ${temporalName}`);
    }
    mapOfClassNamesToStyles.set(originalName, {
      style,
      originalName,
      temporalVariableName: temporalName,
    });
  }

  const evaluatedGlobalStyles = temporalGlobalStyles
    .map((t) => evaluatedNamespace[t])
    .filter((x): x is string => typeof x === "string");

  return { mapOfClassNamesToStyles, evaluatedGlobalStyles };
}
