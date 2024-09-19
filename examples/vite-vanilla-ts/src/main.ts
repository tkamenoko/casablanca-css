import { css, injectGlobal } from "@casablanca-css/core";
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
  color: ${openProps.red5};
  font-size: ${openProps.fontSize6};
  border: ${openProps.borderSize3} solid ${openProps.purple4};
  border-radius: ${openProps.radius3};
`;

const casablancaSpan = css`
  color: ${openProps.teal4};
`;

const tsSpan = css`
  color: ${openProps.blue4};
`;

const divStyle: string = css`
  min-height: 100svh;
  background-image: ${openProps.gradient17};
  composes: ${grid};
  padding: .5rem 0;
  grid-template-columns: auto;
  row-gap: 5px;
  place-content: start center;

  & .${textAlign} {
    font-size: ${openProps.fontSize4};
    font-weight: ${openProps.fontWeight7};
    color: ${openProps.gray1};
  }
`;

const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
  app.innerHTML = /* html */ `
  <div class="${divStyle}">
    <h1 class="${h1Style}">
      <span class="${casablancaSpan}">Casablanca</span> + <span class="${tsSpan}">Vanilla-TS</span>
    </h1>
    <p class="${textAlign}">
      Zero runtime CSS-in-JS for vite.
    </p>
  </div>
`;
}
