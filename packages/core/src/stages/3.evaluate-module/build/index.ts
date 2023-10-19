import type { ModuleLinker } from 'node:vm';
import vm from 'node:vm';

import type { UuidToStylesMap } from '@/stages/2.prepare-compositions/types';

import type { EvaluateModuleReturn } from '../types';
import { registerGlobals, unregisterGlobals } from '../registerGlobals';
import { createComposeInternal } from '../createComposeInternal';

import { nodeModuleLinker } from './nodeModulesLinker';
import { localModulesLinker } from './localModulesLinker';

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
  load: (id: string) => Promise<string>;
};

function injectGlobals(code: string): string {
  return `
${registerGlobals}
${code}
${unregisterGlobals}
`;
}

export async function evaluateModule({
  code,
  modulePath,
  temporalVariableNames,
  uuidToStylesMap,
  load,
}: EvaluateModuleArgs): Promise<EvaluateModuleReturn> {
  const contextifiedObject = vm.createContext({
    __composeInternal: createComposeInternal(uuidToStylesMap),
  });

  const targetLinker: ModuleLinker = async (
    specifier,
    referencingModule,
    extra,
  ) => {
    try {
      const m = await nodeModuleLinker({
        load,
      })(specifier, referencingModule, extra);
      return m;
    } catch (error) {
      const m = await localModulesLinker({
        load,
        modulePath,
      })(specifier, referencingModule, extra);
      return m;
    }
  };

  const injectedCode = injectGlobals(code);
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
      temporalVariableName: temporalName,
      originalName,
    });
  }

  return { mapOfClassNamesToStyles };
}
