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
  padding: .5rem 1rem;
  background-color: ${openProps.gray0};
  color: ${openProps.teal4};
  font-size: ${openProps.fontSize6};
  border: ${openProps.borderSize3} solid currentColor;
  border-radius: ${openProps.radius3};
`;

const divStyle: string = css`
  min-height: 100svh;
  background-image: ${openProps.gradient14};
  composes: ${grid};
  padding: .5rem 0;
  grid-template-columns: auto;
  row-gap: 5px;
  justify-content: center;
  align-content: start;

  & .${textAlign} {
    font-size: ${openProps.fontSize4};
    font-weight: ${openProps.fontWeight7};
    color: ${openProps.gray7};
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
