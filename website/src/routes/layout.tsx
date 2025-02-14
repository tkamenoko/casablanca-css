import "@acab/reset.css";
import { styled } from "@casablanca-css/styled";
import type { Layout } from "rakkasjs";
import { Footer } from "./footer";
import { Header } from "./header";

const BaseLayout = styled("div")`
  min-height: 100svh;
  display: grid;
  grid-template-rows: auto 1fr auto;
`;

const AppLayout: Layout = ({ children }) => {
  return (
    <BaseLayout>
      <Header />
      {children}
      <Footer />
    </BaseLayout>
  );
};

export default AppLayout;
