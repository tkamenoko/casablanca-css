import { styled } from '@macrostyles/react';
import type { FC } from 'react';

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
