import { css } from '@macrostyles/core';

const h1Style = css`
  color: red;
`;

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.innerHTML = /* html */ `
  <div>    
    <h1 class="${h1Style}">Macrostyles + Vanilla-TS</h1>
    <p >
      Zero runtime CSS-in-JS for vite.
    </p>
  </div>
`;
}
