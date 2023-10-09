import { modularScale } from 'polished';
import { css } from '@macrostyles/core';

import { composedStyle } from './composed';
import { composedStyle as anotherComposedStyle } from './deps/composed';

export const styleA = css`
  color: red;
`;

export const styleB = css`
  font-size: ${modularScale(3)};
  composes: ${[styleA, composedStyle, anotherComposedStyle]};
`;
