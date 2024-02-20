import { css, injectGlobal } from "@casablanca/core";

export const staticStyle = css`
  color: blue;
`;

injectGlobal`
  body {
    box-sizing: border-box;
  }
`;
