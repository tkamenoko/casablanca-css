import type { ModuleLinker } from 'node:vm';
import { SourceTextModule, createContext, SyntheticModule } from 'node:vm';

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

  const targetLinker: ModuleLinker = async (specifier, referencingModule) => {
    // TODO: load local files from moduleGraph
    // TODO: load virtual module from moduleGraph
    const imported = await import(specifier);
    const exportNames = Object.keys(imported);
    const m = new SyntheticModule(
      exportNames,
      () => {
        exportNames.forEach((name) => m.setExport(name, imported[name]));
      },
      { context: referencingModule.context }
    );

    return m;
  };
  // create module
  const targetModule = new SourceTextModule(code, {
    context: contextifiedObject,
  });
  await targetModule.link(targetLinker);
  // create exports logger

  const captureModule = new SourceTextModule(
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
