import { styled } from "@casablanca-css/styled";
import type { MDXProvider } from "@mdx-js/react";
import openProps from "open-props";
import { StyledLink } from "rakkasjs";

const H1 = styled("h1")`
  font-size: ${openProps.fontSize6};
`;
const H2 = styled("h2")`
  font-size: ${openProps.fontSize4};
`;
const Ul = styled("ul")`
  list-style: disc inside;
`;
const Code = styled("code")`
  *:not(pre) > & {
    padding: 0 0.2em;
    background-color: ${openProps.gray3};
  }
`;
const Figure = styled("figure")`
  overflow-x: auto;
  max-width: 100%;
`;
const Figcaption = styled("figcaption")`
  width: min-content;
  overflow-x: auto;
  border: ${openProps.borderSize1} solid ${openProps.gray11};
  border-radius: ${openProps.radius2} ${openProps.radius2} 0 0;
  border-bottom: none;
  padding: 0 0.3em;
  line-height: 1.8em;
  font-size: ${openProps.fontSize0};
`;
const Pre = styled("pre")`
  overflow-x: auto;
  padding: 0.8em 1.5em;
  position: relative;
  border-radius: ${openProps.radius2};

  &[title] {
    border-top-left-radius: 0;
  }
`;

export const mdxStyledComponents: Parameters<
  typeof MDXProvider
>[0]["components"] = {
  h1: (props) => {
    return <H1 {...props} />;
  },
  h2: (props) => {
    return <H2 {...props} />;
  },
  code: (props) => {
    return <Code {...props} />;
  },
  figure: (props) => {
    return <Figure {...props} />;
  },
  figcaption: (props) => {
    return <Figcaption {...props} />;
  },
  pre: (props) => {
    return <Pre {...props} />;
  },
  a: ({ href, ...props }) => {
    if (href?.startsWith("https://")) {
      return <a href={href} {...props} target="_blank" rel="noreferrer" />;
    }
    return <StyledLink {...props} />;
  },
  ul: (props) => {
    return <Ul {...props} />;
  },
};
