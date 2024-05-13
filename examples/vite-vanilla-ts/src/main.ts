import { css, injectGlobal } from "@casablanca/core";
import openProps from "open-props";
import { grid, textAlign } from "./styles";

injectGlobal`
  * {
    margin: 0;
    box-sizing: border-box;
  }
`;

const h1Style = css`
  color: red;
  font-size: ${openProps.fontSize6};
  border: 1px solid red;
`;

const divStyle: string = css`
  composes: ${grid};
  grid-template-columns: auto;
  justify-content: center;

  & .${textAlign} {
    font-size: ${openProps.fontSize2};
    font-weight: ${openProps.fontWeight5};
  }
`;

const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
  app.innerHTML = /* html */ `
  <div class="${divStyle}">    
    <h1 class="${h1Style}">Casablanca + Vanilla-TS</h1>
    <p class="${textAlign}">
      Zero runtime CSS-in-JS for vite.
    </p>
  </div>
`;
}
