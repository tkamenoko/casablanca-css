import { css } from '@macrostyles/core';
import type { TaggedStyle } from '@macrostyles/utils';
import type { FC } from 'react';

import { anotherComposedStyle } from './deps/composed';

export const composedStyle = css`
  display: flex;
  composes: ${anotherComposedStyle};
`;

const _styledComponent = css`
  font-weight: bold;
`;
export const Component = (() => (
  <div className={_styledComponent}>Foo</div>
)) as unknown as TaggedStyle<FC>;
Component.__modularizedClassName = _styledComponent;
Component.__rawClassName = '_styledComponent';
