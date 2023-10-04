import { compose, css } from '@macrostyles/core';
import { modularScale } from 'polished';

import { styleA as imported } from './composed';

export const styleB = css`
  ${compose(imported)}
  font-size: ${modularScale(2)};
`;
