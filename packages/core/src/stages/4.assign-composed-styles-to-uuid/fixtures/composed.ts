import { css } from '@macrostyles/core';

import { anotherComposedStyle } from './deps/composed';

export const composedStyle = css`
  display: flex;
  composes: ${anotherComposedStyle};
`;
