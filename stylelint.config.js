/** @type {import('stylelint').Config} */
export default {
  extends: "stylelint-config-standard",
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      customSyntax: "postcss-styled-syntax",
      rules: {
        "property-no-unknown": [true, { ignoreProperties: ["composes"] }],
      },
    },
  ],
};
