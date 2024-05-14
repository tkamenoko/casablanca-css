import { styled } from "@casablanca/styled";
import openProps from "open-props";
import type { Page } from "rakkasjs";
import { LinkWithBorder } from "#@/components/link";

const ContainerDiv = styled("div")`
  display: grid;
  justify-content: center;
  align-items: center;
`;

const StyledH1 = styled("h1")`
  text-align: center;
  font-size: ${openProps.fontSize6};
`;

const Home: Page = () => {
  return (
    <ContainerDiv>
      <StyledH1>Casablanca + Rakkas</StyledH1>
      <LinkWithBorder href="/counter">Go to counter</LinkWithBorder>
    </ContainerDiv>
  );
};

export default Home;
