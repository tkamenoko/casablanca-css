import { css } from '@macrostyles/core';

import { anotherComposedStyle } from './deps/composed';

export const composedStyle = css`
  display: flex;
  ${anotherComposedStyle.__compose__}
`;
