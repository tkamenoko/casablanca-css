import { styled } from '@macrostyles/react';
import type { FC } from 'react';

const Component: FC<{ dataFoo: string }> = ({ dataFoo, ...rest }) => {
  return <div {...rest} data-foo={dataFoo}></div>;
};

const NotExportedComponent = styled('div')`
  font-size: large;
`;

export const TaggedComponent = styled(Component)<{ fontSize: number }>`
  color: red;
  & .${NotExportedComponent} {
    color: green;
    font-size: ${(p) => p.fontSize};
    font-weight: ${(p) => (p.dataFoo.length > 4 ? 'bold' : 'lighter')};
  }
`;
