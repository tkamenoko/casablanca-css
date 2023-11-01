import type { ModuleLinker } from 'node:vm';
import vm from 'node:vm';

import type { UuidToStylesMap } from '../2.prepare-compositions/types';

import type { EvaluateModuleReturn } from './types';
import { createComposeInternal } from './createComposeInternal';
import {
  injectRegisterGlobals,
  createGlobalContext,
} from './injectRegisterGlobals';

const reactRefreshScriptMock = /* js */ `
import RefreshRuntime from '/@react-refresh';
RefreshRuntime.injectIntoGlobalHook(globalThis);
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
  temporalVariableNames,
  uuidToStylesMap,
}: EvaluateArgs): Promise<EvaluateModuleReturn> {
  const contextifiedObject = vm.createContext({
    __composeInternal: createComposeInternal(uuidToStylesMap),
    ...createGlobalContext(),
    console,
    process,
  });
  // build context
  vm.runInContext(injectRegisterGlobals('()=>{};'), contextifiedObject);
  const injectedCode = injectRefresh(code);
  // create module
  const targetModule = new vm.SourceTextModule(injectedCode, {
    context: contextifiedObject,
    identifier: `vm:module(target)`,
  });
  await targetModule.link(linker);
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
