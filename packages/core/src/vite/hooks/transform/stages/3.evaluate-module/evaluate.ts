import type { ModuleLinker } from "node:vm";
import vm from "node:vm";
import type { CapturedVariableNames } from "../1.capture-tagged-styles/types";
import type { UuidToStylesMap } from "../2.prepare-compositions/types";
import { createComposeInternal } from "./createComposeInternal";
import { createGlobalContext } from "./createGlobalContext";
import { injectReactRefresh } from "./injectReactRefresh";
import type { EvaluateModuleReturn } from "./types";

type EvaluateArgs = {
  code: string;
  uuidToStylesMap: UuidToStylesMap;
  capturedVariableNames: CapturedVariableNames;
  temporalGlobalStyles: string[];
  linker: ModuleLinker;
};

export async function evaluate({
  code,
  linker,
  capturedVariableNames,
  temporalGlobalStyles,
  uuidToStylesMap,
}: EvaluateArgs): Promise<EvaluateModuleReturn> {
  const globalPropertyNames = Object.getOwnPropertyNames(
    globalThis,
  ) as (keyof Global)[];
  const currentGlobals = Object.fromEntries(
    globalPropertyNames.map((n) => [n, globalThis[n]]),
  );
  const { injected: injectedCode, reactGlobals } = injectReactRefresh(code);

  const contextifiedObject = vm.createContext({
    ...currentGlobals,
    ...reactGlobals,
    __composeInternal: createComposeInternal(uuidToStylesMap),
    ...createGlobalContext(),
  });
  // create module
  const targetModule = new vm.SourceTextModule(injectedCode, {
    context: contextifiedObject,
    identifier: "vm:module(*target*)",
  });
  await targetModule.link(linker);

  // evaluate
  await targetModule.evaluate();

  // return captured styles
  const captured: Record<string, unknown> = { ...targetModule.namespace };

  const mapOfClassNamesToStyles: EvaluateModuleReturn["mapOfClassNamesToStyles"] =
    new Map();
  for (const { originalName, temporalName } of capturedVariableNames.values()) {
    const style = captured[temporalName];
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
    .map((t) => captured[t])
    .filter((x): x is string => typeof x === "string");

  return { mapOfClassNamesToStyles, evaluatedGlobalStyles };
}
