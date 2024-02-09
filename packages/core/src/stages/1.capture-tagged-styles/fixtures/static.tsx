import { css, injectGlobal } from "@macrostyles/core";
import type { FC } from "react";

injectGlobal`
  body {
    box-sizing: border-box;
  }  
`;

export const style = css`
  display: flex;
  color: blue;
  font-size: large;
`;

const notExported = css`
  color: blue;
`;

export const Component: FC = () => {
  return (
    <button type="button" className={notExported}>
      PUSH!
    </button>
  );
};

injectGlobal`
  img {
    display: block;
  }  
`;

// biome-ignore lint/style/noUnusedTemplateLiteral: test plugin to ignore other template string
export const notStyleString = ``;
