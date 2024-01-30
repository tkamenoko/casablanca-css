import { css, injectGlobal } from '@macrostyles/core';

export const foo = css`
  color: blue;
  font-size: 3em;
`;

export const bar = css`
  color: red;
  font-weight: bold;
`;

injectGlobal`
  body {
    box-sizing: border-box;
  }
`;
