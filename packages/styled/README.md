# @casablanca-css/styled

Styled-API of `casablanca-css` .

## Setup

### Install

```sh
npm install -D @casablanca-css/core @casablanca-css/styled
npm install -D postcss-nested # recommended to support nested @-rule syntax
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
import { casablancaStyled } from "@casablanca-css/styled/vite";
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

See [examples](/examples/) for other projects.

## Usage

```tsx
import { styled } from "@casablanca-css/styled";
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
