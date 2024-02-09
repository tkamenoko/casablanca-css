import { css } from "@macrostyles/core";

export const staticStyle = css`
  color: blue;
`;

const notExported = 4;

export const embedded = css`
  font-size: ${notExported}em;
`;

function getWeight(): string {
  return "bold";
}

export const functionCall = css`
  font-weight: ${getWeight()};
`;

// biome-ignore lint/style/noUnusedTemplateLiteral: test plugin to ignore other templates
export const thisIs = `not a target`;
export const thisIsAlsoIgnored = document.baseURI;
