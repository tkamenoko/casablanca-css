import { resolve } from 'node:path';

import { test } from 'vitest';
import { normalizePath } from 'vite';

import { createVirtualCssModule } from '.';

test('should create css string from partial styles and importer id', async ({
  expect,
}) => {
  const evaluatedStyles = [
    {
      variableName: 'foo',
      style: `
  color: blue;
  font-size: 3em;
  `,
    },
    {
      variableName: 'bar',
      style: `
  color: red;
  font-weight: bold;
  `,
    },
  ];
  const projectRoot = normalizePath(process.cwd());
  const importerId = normalizePath(
    resolve(
      import.meta.url
        .replace(/^file:\/+/, '')
        .split('/')
        .slice(0, -1)
        .join('/'),
      './fixtures.ts'
    )
  );

  const { importId, style } = createVirtualCssModule({
    evaluatedStyles,
    importerId,
    projectRoot,
  });

  const pathInProject = importerId.replace(projectRoot, '').slice(1);
  expect(importId).toEqual(`macrostyles:${pathInProject}.module.css`);
  expect(style).toMatch(new RegExp(`\\.foo *{`));
  for (const evaluated of evaluatedStyles) {
    expect(style).toMatch(evaluated.style);
  }
});
