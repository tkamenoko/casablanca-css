import { styled } from "@casablanca-css/styled";
import { MDXProvider } from "@mdx-js/react";
import openProps from "open-props";
import { type Page, StyledLink, useHead } from "rakkasjs";
import { tokens } from "#@/styles/tokens";
import CodeExample from "./codeExample.mdx";

const HomeWrapper = styled("main")`
  display: grid;
  grid-template-rows: auto;
  row-gap: 1rem;
  container-type: inline-size;
  background-image: ${openProps.gradient9};
`;

const Heading = styled("h1")`
  display: grid;
  grid-template-rows: repeat(3, auto);
  row-gap: 2rem;
  align-items: center;
  padding: 4rem 0;

  @container (width < 1024px) {
    row-gap: 0.5rem;
    padding: 2rem 0;
  }
`;

const Phrase = styled("span")`
  text-align: center;
  font-size: 4rem;
  color: ${tokens.colors.brand};

  @container (width < 1024px) {
    line-height: 1.1em;
  }
`;

const Descriptions = styled("div")`
  padding: 1rem 0;
`;

const Description = styled("p")`
  text-align: center;
  font-size: ${openProps.fontSize2};
  font-weight: ${openProps.fontWeight6};
  color: ${tokens.colors.brand};
`;

const Link = styled("a")`
  color: ${tokens.colors.accent};
`;

const ExampleWrapper = styled("div")`
  display: grid;
  grid-template-columns: 1fr 40em 1fr;

  & > * {
    grid-column: 2 / 3;
    border: ${openProps.borderSize4} solid rgb(40 44 52);
    border-radius: ${openProps.radius2};
  }

  & figure {
    overflow-x: auto;
    max-width: 100%;
  }

  & pre {
    overflow-x: auto;
  }

  @container (width <= 700px) {
    grid-template-columns: 1fr;
    padding: 0 0.5rem;

    & > * {
      grid-column: unset;
    }
  }
`;

const GetStarted = styled("div")`
  display: grid;
  align-items: center;
  justify-content: center;
  padding: 3em 0;
`;

const GoToDocs = styled(StyledLink)`
  color: ${tokens.colors.brand};
  background-color: ${openProps.gray0};
  padding: 0.2em 1em;
  font-size: ${openProps.fontSize5};
  font-weight: ${openProps.fontWeight7};
  border: ${openProps.borderSize4} solid currentColor;
  border-radius: ${openProps.radius5};
`;

const Home: Page = () => {
  useHead({ title: "casablanca-css" });
  return (
    <HomeWrapper>
      <Heading>
        <Phrase>Zero runtime.</Phrase>
        <Phrase>Minimum config.</Phrase>
        <Phrase>Flexible.</Phrase>
      </Heading>
      <Descriptions>
        <Description>
          casablanca-css is Zero-Runtime CSS-in-JS library built on top of{" "}
          <Link href="https://vite.dev" target="_blank" rel="noreferrer">
            Vite
          </Link>
          .
        </Description>
        <Description>Write real CSS styles in JS code.</Description>
        <Description>
          Works with any frameworks including SSR environment.
        </Description>
      </Descriptions>
      <ExampleWrapper>
        <MDXProvider>
          <CodeExample />
        </MDXProvider>
      </ExampleWrapper>
      <GetStarted>
        <GoToDocs href="/docs">Get started</GoToDocs>
      </GetStarted>
    </HomeWrapper>
  );
};

export default Home;
