import type { ModuleLinker } from 'node:vm';
import { SourceTextModule, createContext } from 'node:vm';

import type { ModuleGraph } from 'vite';

type VariableName = string;

type EvaluateModuleArgs = {
  code: string;
  moduleId: string;
  moduleGraph: ModuleGraph;
  variableNames: string[];
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
  moduleGraph,
  moduleId,
  variableNames,
}: EvaluateModuleArgs): Promise<EvaluateModuleReturn> {
  // moduleId is a string as full path of the module.
  // create linker using module graph
  // TODO!
  let moduleCapture: Record<string, string> = {};
  const contextifiedObject = createContext({
    capture: (x: Record<string, string>): void => {
      moduleCapture = x;
    },
  });
  const targetLinker: ModuleLinker = async () => {
    // TODO!
  };
  // create module
  const targetModule = new SourceTextModule(code, {
    context: contextifiedObject,
  });
  await targetModule.link(targetLinker);
  // create exports logger

  const loggerModule = new SourceTextModule(
    `
  import * as target from "target";

  capture(target);
  `,
    { context: contextifiedObject }
  );
  const loggerLinker: ModuleLinker = async (specifier, referencingModule) => {
    if (specifier === 'target') {
      return targetModule;
    }
    throw new Error('Unreachable!');
  };
  await loggerModule.link(loggerLinker);
  // evaluate
  await loggerModule.evaluate();
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