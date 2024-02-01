import type { GlobalProvider } from '@ladle/react';
import { injectGlobal } from "@macrostyles/core";

injectGlobal`
  * {
    margin: 0;
    box-sizing: border-box;
  }
`;


export const Provider: GlobalProvider = ({ children }) => {
  return <>{children}</>;
};
