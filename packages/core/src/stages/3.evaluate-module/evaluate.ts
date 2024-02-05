import type { ModuleLinker } from 'node:vm';
import vm from 'node:vm';

import type { UuidToStylesMap } from '../2.prepare-compositions/types';

import type { EvaluateModuleReturn } from './types';
import { createComposeInternal } from './createComposeInternal';
import { createGlobalContext } from './injectRegisterGlobals';
import { injectReactRefresh } from './injectReactRefresh';

type EvaluateArgs = {
  code: string;
  uuidToStylesMap: UuidToStylesMap;
  temporalVariableNames: Map<
    string,
    {
      originalName: string;
      temporalName: string;
    }
  >;
  temporalGlobalStyles: string[];
  linker: ModuleLinker;
};

export async function evaluate({
  code,
  linker,
  temporalVariableNames,
  temporalGlobalStyles,
  uuidToStylesMap,
}: EvaluateArgs): Promise<EvaluateModuleReturn> {
  const globalPropertyNames = Object.getOwnPropertyNames(
    globalThis,
  ) as (keyof Global)[];
  const currentGlobals = Object.fromEntries(
    globalPropertyNames.map((n) => [n, globalThis[n]]),
  );

  const contextifiedObject = vm.createContext({
    ...currentGlobals,
    __composeInternal: createComposeInternal(uuidToStylesMap),
    ...createGlobalContext(),
  });
  // create module
  const injectedCode = injectReactRefresh(code);
  const targetModule = new vm.SourceTextModule(injectedCode, {
    context: contextifiedObject,
    identifier: `vm:module(*target*)`,
  });
  await targetModule.link(linker);

  // evaluate
  await targetModule.evaluate();

  // return captured styles
  const captured: Record<string, unknown> = { ...targetModule.namespace };

  const mapOfClassNamesToStyles: EvaluateModuleReturn['mapOfClassNamesToStyles'] =
    new Map();
  for (const { originalName, temporalName } of temporalVariableNames.values()) {
    const style = captured[temporalName];
    if (typeof style !== 'string') {
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
    .filter((x): x is string => typeof x === 'string');

  return { mapOfClassNamesToStyles, evaluatedGlobalStyles };
}
