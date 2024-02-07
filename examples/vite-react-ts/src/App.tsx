import { useState, type FC } from 'react';
import { styled } from '@macrostyles/react';
import { modularScale } from 'polished';

import { Button } from './Button';

const StyledButton = styled(Button)`
  display: block;
  border: 3px solid blue;
`;

const StyledPWithAdditionalProps = styled('p') <{
  borderColor: 'red' | 'green' | 'blue';
}>`
  border: 3px solid ${(p) => p.borderColor};
`;

const StyledH1 = styled("h1")`
  font-size: ${modularScale(2)};
`

const ContainerDiv = styled('div')`
  display: grid;
  grid-template-columns: auto;
  justify-content: center;
  align-items: center;
  & > .${StyledPWithAdditionalProps} {
    text-align: center;
  }
`;

export const App: FC = () => {
  const [color, setColor] = useState<'red' | 'green' | 'blue'>('red');
  return (
    <ContainerDiv>
      <StyledH1>Macrostyles + React-TS</StyledH1>
      <p>Zero runtime CSS-in-JS for vite.</p>
      <StyledButton />
      <StyledPWithAdditionalProps borderColor={color}>
        Dynamic style
      </StyledPWithAdditionalProps>
      <button
        type="button"
        onClick={() =>
          setColor((prev) =>
            prev === 'red' ? 'blue' : prev === 'blue' ? 'green' : 'red',
          )
        }
      >
        ChangeColor
      </button>
    </ContainerDiv>
  );
};
