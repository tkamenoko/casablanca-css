type VariableName = string;

export type EvaluateModuleReturn = {
  mapOfClassNamesToStyles: Map<
    VariableName,
    {
      temporalVariableName: string;
      originalName: string;
      style: string;
    }
  >;
};
