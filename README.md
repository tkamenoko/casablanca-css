# casablanca-css

Zero-Runtime CSS-in-JS powered by vite.

## Features

- Generating simple CSS-Module files; No JS runtime codes!
- Work with any `vite` and `postcss` plugins
- Dynamic styling for `styled` JSX components
- Refer to other components in selector
- Reuse common styles with `composes` property

## Setup

### Install

```sh
npm install -D @casablanca/core
npm install -D postcss-nested  # recommended to support nested @-rule syntax
npm install -D @casablanca/styled  # install if you want styled-components-like API
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

#### For Vanilla-TS project

```ts
// vite.config.ts
import { casablanca } from "@casablanca/core/vite";
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

#### For React-TS project

```ts
// vite.config.ts
import { casablanca } from "@casablanca/core/vite";
import { casablancaStyled } from "@casablanca/styled/vite";
import react from "@vitejs/plugin-react";
import postcssNested from "postcss-nested";
import { defineConfig } from "vite";

export default defineConfig({
  css: {
    postcss: { plugins: [postcssNested()] },
    devSourcemap: true,
  },
  plugins: [react(), casablancaStyled(), casablanca()],
});
```

---

See [examples](/examples/) for other projects.

## Usage

### `css` tag

```tsx
import { css } from "@casablanca/core";
import { colors } from "./themes";

const button = css`
  color: ${colors.primary};
  border: 4px solid currentcolor;
`;

export const Button = () => <button className={button}>Click!</button>;
```

### `styled` tag

```tsx
import { styled } from "@casablanca/styled";
import { MyComponent } from "./components";
import { colors, baseButton } from "./themes";

export const Button = styled("button")`
  composes: ${baseButton};
  color: ${colors.primary};
`;

export const MyStyledComponent = styled(MyComponent)<{ state: "error" | "ok" }>`
  color: ${(props) => (props.state === "ok" ? "green" : "red")};
`;
```
