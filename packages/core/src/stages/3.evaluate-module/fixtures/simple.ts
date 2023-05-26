export const staticStyle = `
  color: blue;
`;

const notExported = 4;

export const embedded = `
  font-size: ${notExported}em;
`;

function getWeight(): string {
  return 'bold';
}

export const functionCall = `
  font-weight: ${getWeight()};
`;

export const thisIs = `not a target`;
