/**
 * @type {import("eslint").ESLint.ConfigData}
 */
const config = {
  root: true,
  extends: ['eslint:recommended', 'plugin:import/recommended', 'prettier'],
  rules: {
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        pathGroups: [
          {
            pattern: '@/**',
            group: 'external',
            position: 'after',
          },
        ],
      },
    ],
    'import/no-unresolved': 'off',
  },
  parserOptions: {
    ecmaVersion: 'latest',
  },
  env: {
    es6: true,
    node: true,
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/strict',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: [
          './packages/*/tsconfig.json',
          './testbed/*/tsconfig.json',
          './tsconfig.base.json',
        ],
      },
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
        '@typescript-eslint/consistent-type-imports': [
          'warn',
          { disallowTypeAnnotations: false },
        ],
        '@typescript-eslint/no-unused-vars': [
          'error',
          { varsIgnorePattern: '^_+', argsIgnorePattern: '^_+' },
        ],
        '@typescript-eslint/explicit-function-return-type': [
          'warn',
          {
            allowExpressions: true,
            allowConciseArrowFunctionExpressionsStartingWithVoid: true,
          },
        ],
      },
    },
  ],
};

module.exports = config;
