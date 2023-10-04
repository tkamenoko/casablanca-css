import { css } from '@macrostyles/core';
import type { FC } from 'react';

export const styleA = css`
  color: aliceblue;
`;

export const notCss = `
  this string should not be replaced
`;

const styleB = css`
  color: aqua;
`;

export const Page: FC = () => {
  return <div className={styleB}>YAY!</div>;
};
