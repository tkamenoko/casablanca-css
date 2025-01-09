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

export const mdxStyledComponents: Parameters<
  typeof MDXProvider
>[0]["components"] = {
  h1: (props) => {
    return <H1 {...props} />;
  },
  h2: (props) => {
    return <H2 {...props} />;
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
