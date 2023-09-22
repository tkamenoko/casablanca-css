type VariableName = string;

export type EvaluateModuleReturn = {
  mapOfVariableNamesToStyles: Map<
    VariableName,
    {
      variableName: string;
      style: string;
    }
  >;
};
