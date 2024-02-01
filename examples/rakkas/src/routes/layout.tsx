import { injectGlobal } from "@macrostyles/core";
import type { Layout } from 'rakkasjs';

injectGlobal`
  * {
    margin: 0;
    box-sizing: border-box;
  }
`;

const AppLayout: Layout = ({ children }) => {
  return <>{children}</>;
};

export default AppLayout;
