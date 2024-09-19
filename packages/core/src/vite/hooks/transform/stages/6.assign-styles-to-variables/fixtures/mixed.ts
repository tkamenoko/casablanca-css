import { css, injectGlobal } from "@casablanca-css/core";

export const styleA = css`
  color: aliceblue;
`;

injectGlobal`
  body {
    box-sizing: border-box;
  }
`;
