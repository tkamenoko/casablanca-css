import type { ModuleLinker } from 'node:vm';
import vm from 'node:vm';

import type { EvaluateModuleReturn } from '../types';

import { nodeModuleLinker } from './nodeModulesLinker';
import { localModulesLinker } from './localModulesLinker';

type VariableName = string;

type EvaluateModuleArgs = {
  code: string;
  moduleId: string;
  variableNames: string[];
  load: (id: string) => Promise<string>;
};

export async function evaluateModule({
  code,
  moduleId,
  variableNames,
  load,
}: EvaluateModuleArgs): Promise<EvaluateModuleReturn> {
  const contextifiedObject = vm.createContext({});

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
        moduleId,
      })(specifier, referencingModule, extra);
      return m;
    }
  };

  // create module
  const targetModule = new vm.SourceTextModule(code, {
    context: contextifiedObject,
  });
  await targetModule.link(targetLinker);
  // evaluate
  await targetModule.evaluate();
  // return captured styles
  const captured: Record<string, unknown> = { ...targetModule.namespace };

  const mapOfVariableNamesToStyles = new Map<
    VariableName,
    {
      variableName: string;
      style: string;
    }
  >();

  for (const variableName of variableNames) {
    const style = captured[variableName];
    if (typeof style !== 'string') {
      throw new Error(`Failed to capture variable ${variableName}`);
    }
    mapOfVariableNamesToStyles.set(variableName, { style, variableName });
  }

  return { mapOfVariableNamesToStyles };
}
