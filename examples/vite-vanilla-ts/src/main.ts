import { css } from '@macrostyles/core';
import { modularScale } from 'polished';

import { grid, textAlign } from './styles';

const h1Style = css`
  color: red;
  font-size: ${modularScale(4)};
`;

const divStyle = css`
  composes: ${grid};
  grid-template-columns: auto;
  justify-content: center;

  & .${textAlign} {
    font-size: ${modularScale(2)};
    font-weight: bold;
  }
`;

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.innerHTML = /* html */ `
  <div class="${divStyle}">    
    <h1 class="${h1Style}">Macrostyles + Vanilla-TS</h1>
    <p class="${textAlign}">
      Zero runtime CSS-in-JS for vite.
    </p>
  </div>
`;
}