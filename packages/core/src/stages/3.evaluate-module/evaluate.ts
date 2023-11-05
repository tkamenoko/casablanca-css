import type { ModuleLinker, Module } from 'node:vm';
import vm from 'node:vm';

import type { UuidToStylesMap } from '../2.prepare-compositions/types';

import type { EvaluateModuleReturn } from './types';
import { createComposeInternal } from './createComposeInternal';
import { createGlobalContext } from './injectRegisterGlobals';

const reactRefreshScriptMock = /* js */ `
import RefreshRuntime from '/@react-refresh';
RefreshRuntime.injectIntoGlobalHook(window);
globalThis.$RefreshReg$ = () => {};
globalThis.$RefreshSig$ = () => (type) => type;
globalThis.__vite_plugin_react_preamble_installed__ = true;
`;

function injectRefresh(code: string): string {
  return `
${code.replace(
  /import\s+RefreshRuntime\s+from\s+["']\/@react-refresh["'];/gm,
  reactRefreshScriptMock,
)}
`;
}

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
    console,
    process,
  });
  // create module
  const injectedCode = injectRefresh(code);
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
  const error = await targetModule.evaluate().catch((e) => e);
  if (error) {
    console.error(error);
    throw error;
  }

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
