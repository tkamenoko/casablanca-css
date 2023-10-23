import type { ModuleLinker } from 'node:vm';
import vm from 'node:vm';

import type { UuidToStylesMap } from '@/stages/2.prepare-compositions/types';

import { createWindowForContext } from '../createWindowForContext';
import type { EvaluateModuleReturn } from '../types';
import { createComposeInternal } from '../createComposeInternal';

import { nodeModuleLinker } from './nodeModulesLinker';
import { localModulesLinker } from './localModulesLinker';
import { baseLinker } from './baseLinker';

type VariableName = string;

type EvaluateModuleArgs = {
  code: string;
  modulePath: string;
  uuidToStylesMap: UuidToStylesMap;
  temporalVariableNames: Map<
    string,
    {
      originalName: string;
      temporalName: string;
    }
  >;
  load: (id: string) => Promise<Record<string, unknown>>;
  resolveId: (id: string) => Promise<string | null>;
};

const reactRefreshScriptMock = `
import RefreshRuntime from '/@react-refresh'
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
`;

function injectRefresh(code: string): string {
  return `
${code.replace(
  /import\s+RefreshRuntime\s+from\s+["']\/@react-refresh["'];/gm,
  reactRefreshScriptMock,
)}
`;
}

export async function evaluateModule({
  code,
  modulePath,
  temporalVariableNames,
  uuidToStylesMap,
  load,
  resolveId,
}: EvaluateModuleArgs): Promise<EvaluateModuleReturn> {
  const contextifiedObject = vm.createContext({
    __composeInternal: createComposeInternal(uuidToStylesMap),
    ...createWindowForContext(),
  });

  const targetLinker: ModuleLinker = async (
    specifier,
    referencingModule,
    extra,
  ) => {
    const linker = baseLinker(load);
    try {
      const m = await nodeModuleLinker({
        baseLinker: linker,
        resolveId,
      })(specifier, referencingModule, extra);
      return m;
    } catch (error) {
      const m = await localModulesLinker({
        baseLinker: linker,
        modulePath,
      })(specifier, referencingModule, extra);

      return m;
    }
  };
  const injectedCode = injectRefresh(code);

  // create module
  const targetModule = new vm.SourceTextModule(injectedCode, {
    context: contextifiedObject,
  });
  await targetModule.link(targetLinker);
  // evaluate
  await targetModule.evaluate();
  // return captured styles
  const captured: Record<string, unknown> = { ...targetModule.namespace };

  const mapOfClassNamesToStyles = new Map<
    VariableName,
    {
      temporalVariableName: string;
      originalName: string;
      style: string;
    }
  >();

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
