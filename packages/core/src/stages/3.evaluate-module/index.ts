import type { ModuleGraph } from 'vite';

type VariableName = string;

type EvaluateModuleArgs = {
  code: string;
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

export async function evaluateModule(
  params: EvaluateModuleArgs
): Promise<EvaluateModuleReturn> {
  throw new Error('TODO!');
}
