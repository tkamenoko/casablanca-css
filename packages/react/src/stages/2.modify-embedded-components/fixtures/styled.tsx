import { styled } from '@macrostyles/react';
import { css } from '@macrostyles/core';
import type { FC } from 'react';

import { StyledDiv } from './externalComponent';

const Component: FC<{ dataFoo: string }> = ({ dataFoo, ...rest }) => {
  return <div {...rest} data-foo={dataFoo}></div>;
};

const NotExportedComponent = styled('div')`
  font-size: large;
`;

export const TaggedComponent = styled(Component)`
  color: red;
  & .${NotExportedComponent} {
    color: green;
  }
`;

export const className = css`
  .${TaggedComponent} {
    font-weight: bold;
  }
  .${StyledDiv} {
    border-radius: 2em;
  }
`;
