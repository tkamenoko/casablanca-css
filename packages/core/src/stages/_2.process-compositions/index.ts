type VariableName = string;

type ProcessCompositionsArgs = {
  code: string;
  mapOfVariableNamesToClassNames: Map<
    VariableName,
    {
      variableName: string;
      className: string;
    }
  >;
};
type ProcessCompositionsReturn = {
  transformed: string;
};

export function processCompositions(
  params: ProcessCompositionsArgs
): ProcessCompositionsReturn {
  throw new Error('TODO!');
}
