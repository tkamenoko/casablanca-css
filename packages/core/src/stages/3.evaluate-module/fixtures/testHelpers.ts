import type { ExpectStatic } from 'vitest';

export function testObjectHasEvaluatedStyles({
  expect,
  mapOfClassNamesToStyles,
  variableNames,
  moduleExports,
}: {
  expect: ExpectStatic;
  moduleExports: Record<string, unknown>;
  mapOfClassNamesToStyles: Map<
    string,
    {
      temporalVariableName: string;
      originalName: string;
      style: string;
    }
  >;
  variableNames: readonly string[];
}): void {
  expect(mapOfClassNamesToStyles.size).toEqual(variableNames.length);
  for (const variableName of variableNames) {
    const value = moduleExports[variableName];
    expect(mapOfClassNamesToStyles.get(variableName)?.style).toEqual(value);
  }
}
