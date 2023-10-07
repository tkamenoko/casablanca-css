import { css } from '@macrostyles/core';
import { modularScale } from 'polished';

import { styleA as imported } from './composed';

export const styleB = css`
  ${imported.__compose__}
  font-size: ${modularScale(2)};
`;
