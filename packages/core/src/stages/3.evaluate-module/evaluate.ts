import type { ModuleLinker, Module } from 'node:vm';
import vm from 'node:vm';

import type { UuidToStylesMap } from '../2.prepare-compositions/types';

import type { EvaluateModuleReturn } from './types';
import { createComposeInternal } from './createComposeInternal';
import { createGlobalContext } from './injectRegisterGlobals';
import { injectReactRefresh } from './injectReaactRefresh';

type EvaluateArgs = {
  code: string;
  modulesCache: Map<string, Module>;
  uuidToStylesMap: UuidToStylesMap;
  temporalVariableNames: Map<
    string,
    {
      originalName: string;
      temporalName: string;
    }
  >;
  linker: ModuleLinker;
};

export async function evaluate({
  code,
  linker,
  modulesCache,
  temporalVariableNames,
  uuidToStylesMap,
}: EvaluateArgs): Promise<EvaluateModuleReturn> {
  const contextifiedObject = vm.createContext({
    __composeInternal: createComposeInternal(uuidToStylesMap),
    ...createGlobalContext(),
    process,
  });
  // create module
  const injectedCode = injectReactRefresh(code);
  const targetModule = new vm.SourceTextModule(injectedCode, {
    context: contextifiedObject,
    identifier: `vm:module(*target*)`,
  });
  await targetModule.link(linker);
  // evaluate dependencies
  const sortedDeps = [...modulesCache.values()].slice().sort((a, b) => {
    return (
      (a.dependencySpecifiers?.length || 0) -
      (b.dependencySpecifiers?.length || 0)
    );
  });
  for (const dep of sortedDeps) {
    if (dep.status !== 'evaluated') {
      await dep.evaluate();
    }
  }

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

  return { mapOfClassNamesToStyles };
}
