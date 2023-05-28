import { test } from 'vitest';

import simpleCode from './fixtures/simple?raw';
import { styleA, notCss, styleB } from './fixtures/simple';

import { assignStylesToCapturedVariables } from '.';

test("should replace variable initializations with `styles[xxx]`, then append `import styles from 'xxx.css'`", async ({
  expect,
}) => {
  const variableNames = ['styleA', 'styleB'];
  const cssImportId = `macrostyles:fixtures/simple.ts.module.css`;
  const { transformed } = assignStylesToCapturedVariables({
    code: simpleCode,
    cssImportId,
    variableNames,
  });
  expect(transformed).not.toMatch(styleA);
  expect(transformed).not.toMatch(styleB);
  expect(transformed).toMatch(notCss);

  expect(transformed).toMatch(cssImportId);
});
