import { css } from "@casablanca-css/core";

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

export const thisIs = `not a target`;
export const thisIsAlsoIgnored = document.baseURI;
