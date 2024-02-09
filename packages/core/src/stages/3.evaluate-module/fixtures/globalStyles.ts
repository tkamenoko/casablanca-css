import { css, injectGlobal } from "@macrostyles/core";

export const staticStyle = css`
  color: blue;
`;

injectGlobal`
  body {
    box-sizing: border-box;
  }
`;
