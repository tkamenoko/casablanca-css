import { injectGlobal } from '@macrostyles/core';

const fontSize = '16px';

injectGlobal`
  body {
    box-sizing: border-box;
    font-size: ${fontSize};
  }
`;
