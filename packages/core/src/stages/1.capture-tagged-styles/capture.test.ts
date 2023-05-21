import { test } from 'vitest';

import staticStyles from './fixtures/static?raw';

import { captureTaggedStyles } from '.';

test('should capture variable names initialized with css tag', async ({
  expect,
}) => {
  const { capturedVariableNames, transformed } = captureTaggedStyles({
    code: staticStyles,
    options: {
      babelOptions: { parserOpts: { plugins: ['typescript', 'jsx'] } },
    },
  });
  expect(capturedVariableNames).toEqual(['style', 'notExported']);
  expect(transformed).not.toMatch(/css/);
  expect(transformed).not.toMatch(/@macrostyles\/core/);

  for (const capturedVariableName of capturedVariableNames) {
    const regexp = new RegExp(`export .+ ${capturedVariableName}`);
    expect(transformed).toMatch(regexp);
  }
});
