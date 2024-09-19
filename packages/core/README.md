# @casablanca-css/core

Core package of `casablanca-css` .

## Setup

### Install

```sh
npm install -D @casablanca-css/core
npm install -D postcss-nested  # recommended to support nested @-rule syntax
```

### Config package.json

```json
{
  ...
  "type": "module",
  ...
}
```

Env-var `NODE_OPTIONS=--experimental-vm-modules` is also required because `casablanca-css` uses [`vm.Module`](https://nodejs.org/api/vm.html#class-vmmodule) features.

### Config plugins

```ts
// vite.config.ts
import { casablanca } from "@casablanca-css/core/vite";
import postcssNested from "postcss-nested";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [casablanca()],
  css: {
    postcss: { plugins: [postcssNested()] },
    devSourcemap: true,
  },
});
```

See [examples](/examples/) for other projects.

## Usage

```tsx
import { css } from "@casablanca-css/core";
import { colors } from "./themes";

const button = css`
  color: ${colors.primary};
  border: 4px solid currentcolor;
`;

export const Button = () => <button className={button}>Click!</button>;
```
