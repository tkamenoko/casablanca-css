import type { ExpectStatic } from 'vitest';

export function testObjectHasEvaluatedStyles({
  expect,
  mapOfVariableNamesToStyles,
  variableNames,
  moduleExports,
}: {
  expect: ExpectStatic;
  moduleExports: Record<string, unknown>;
  mapOfVariableNamesToStyles: Map<
    string,
    {
      variableName: string;
      style: string;
    }
  >;
  variableNames: readonly string[];
}): void {
  expect(mapOfVariableNamesToStyles.size).toEqual(variableNames.length);
  for (const variableName of variableNames) {
    const value = moduleExports[variableName];
    expect(mapOfVariableNamesToStyles.get(variableName)?.style).toEqual(value);
  }
}
