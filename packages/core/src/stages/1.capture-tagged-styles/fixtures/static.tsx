import { css } from '@macrostyles/core';
import type { FC } from 'react';

export const style = css`
  display: flex;
  color: blue;
  font-size: large;
`;

const notExported = css`
  color: blue;
`;

export const Component: FC = () => {
  return <button className={notExported}>PUSH!</button>;
};

export const notStyleString = ``;
