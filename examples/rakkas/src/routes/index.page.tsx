import type { Page } from 'rakkasjs';
import { styled } from '@macrostyles/react';
import { modularScale } from 'polished';

import { LinkWithBorder } from '@/components/link';

const ContainerDiv = styled('div')`
  display: grid;
  justify-content: center;
  align-items: center;
`;

const StyledH1 = styled('h1')`
  text-align: center;
  font-size: ${modularScale(4)};
`;

const Home: Page = () => {
  return (
    <ContainerDiv>
      <StyledH1>Macrostyles + Rakkas</StyledH1>
      <LinkWithBorder href="/counter">Go to counter</LinkWithBorder>
    </ContainerDiv>
  );
};

export default Home;
