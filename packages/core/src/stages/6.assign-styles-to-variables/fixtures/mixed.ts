import { css, injectGlobal } from "@casablanca/core";

export const styleA = css`
  color: aliceblue;
`;

injectGlobal`
  body {
    box-sizing: border-box;
  }
`;
