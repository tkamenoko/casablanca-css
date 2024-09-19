import { injectGlobal } from "@casablanca-css/core";
import type { GlobalProvider } from "@ladle/react";

injectGlobal`
  * {
    margin: 0;
    box-sizing: border-box;
  }
`;

export const Provider: GlobalProvider = ({ children }) => {
  return <>{children}</>;
};
