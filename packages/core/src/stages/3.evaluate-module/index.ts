import type { ModuleLinker } from 'node:vm';
import vm from 'node:vm';

import { nodeModuleLinker } from './nodeModulesLinker';
import { localModulesLinker } from './localModulesLinker';
import { staticAssetsLinker } from './staticAssetsLinker';

type VariableName = string;

type EvaluateModuleArgs = {
  code: string;
  moduleId: string;
  variableNames: string[];
  load: (id: string) => Promise<string>;
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
    try {
      const m = await nodeModuleLinker(specifier, referencingModule, extra);
      return m;
    } catch (error) {
      const m = await staticAssetsLinker({
        contextifiedObject,
        load,
        moduleId,
      })(specifier, referencingModule, extra);
      // const m = await localModulesLinker({
      //   contextifiedObject,
      //   moduleId,
      // })(specifier, referencingModule, extra);
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
