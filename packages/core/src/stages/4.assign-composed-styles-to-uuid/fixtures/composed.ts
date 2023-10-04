import { css, compose } from '@macrostyles/core';

import { anotherComposedStyle } from './deps/composed';

export const composedStyle = css`
  display: flex;
  ${compose(anotherComposedStyle)}
`;
