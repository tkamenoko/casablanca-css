import "@acab/reset.css";
import { styled } from "@casablanca-css/styled";
import type { Layout } from "rakkasjs";

const BaseLayoutDiv = styled("div")`
  min-height: 100svh;
`;

const AppLayout: Layout = ({ children }) => {
  return <BaseLayoutDiv>{children}</BaseLayoutDiv>;
};

export default AppLayout;
