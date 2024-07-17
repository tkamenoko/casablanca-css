import { injectGlobal } from "@casablanca/core";
import { styled } from "@casablanca/styled";
import openProps from "open-props";
import type { Layout } from "rakkasjs";

injectGlobal`
  * {
    margin: 0;
    box-sizing: border-box;
  }
`;

const BaseLayoutDiv = styled("div")`
  min-height: 100svh;
  display: grid;
  padding: .5rem 0;
  grid-template-columns: auto;
  row-gap: 5px;
  place-content: start center;
  background-image: ${openProps.gradient1};
`;

const AppLayout: Layout = ({ children }) => {
  return <BaseLayoutDiv>{children}</BaseLayoutDiv>;
};

export default AppLayout;
