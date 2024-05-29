import { styled } from "@casablanca/styled";
import openProps from "open-props";
import type { Page } from "rakkasjs";
import { LinkWithBorder } from "#@/components/link";

const StyledH1 = styled("h1")`
  padding: .5rem 1rem;
  background-color: ${openProps.gray0};
  color: ${openProps.red5};
  font-size: ${openProps.fontSize6};
  border: ${openProps.borderSize3} solid ${openProps.pink8};
  border-radius: ${openProps.radius3};
`;
const CasablancaSpan = styled("span")`
  color: ${openProps.teal4};
`;
const RakkasSpan = styled("span")`
  color: ${openProps.pink5};
`;

const Home: Page = () => {
  return (
    <>
      <StyledH1>
        <CasablancaSpan>Casablanca</CasablancaSpan>
        {" + "}
        <RakkasSpan>Rakkas</RakkasSpan>
      </StyledH1>
      <LinkWithBorder href="/counter">Go to counter</LinkWithBorder>
    </>
  );
};

export default Home;
