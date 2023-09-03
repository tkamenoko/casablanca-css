import type { ModuleLinker } from 'node:vm';
import vm from 'node:vm';

import { nodeModuleLinker } from './nodeModulesLinker';
import { localModulesLinker } from './localModulesLinker';
import { baseLinker } from './baseLinker';

type VariableName = string;

type EvaluateModuleArgs = {
  code: string;
  moduleId: string;
  variableNames: string[];
  load: (id: string) => Promise<Record<string, unknown>>;
  resolveId: (id: string) => Promise<string | null>;
};

type EvaluateModuleReturn = {
  mapOfVariableNamesToStyles: Map<
    VariableName,
    {
      variableName: string;
      style: string;
    }
  >;
};

export async function evaluateModule({
  code,
  moduleId,
  variableNames,
  load,
  resolveId,
}: EvaluateModuleArgs): Promise<EvaluateModuleReturn> {
  let moduleCapture: Record<string, string> = {};
  const contextifiedObject = vm.createContext({
    capture: (x: Record<string, string>): void => {
      moduleCapture = x;
    },
  });

  const targetLinker: ModuleLinker = async (
    specifier,
    referencingModule,
    extra
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
  // create exports capture

  const captureModule = new vm.SourceTextModule(
    `
  import * as target from "macrostyles:target";

  capture(target);
  `,
    { context: contextifiedObject }
  );
  const captureLinker: ModuleLinker = async (specifier) => {
    if (specifier === 'macrostyles:target') {
      return targetModule;
    }
    throw new Error('Unreachable!');
  };
  await captureModule.link(captureLinker);
  // evaluate
  await captureModule.evaluate();
  // return captured styles
  const captured: Record<string, string> = { ...moduleCapture };

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
