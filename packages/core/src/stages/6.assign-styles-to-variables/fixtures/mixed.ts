import { css, injectGlobal } from '@macrostyles/core';

export const styleA = css`
  color: aliceblue;
`;

injectGlobal`
  body {
    box-sizing: border-box;
  }
`;
