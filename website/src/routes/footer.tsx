import { styled } from "@casablanca-css/styled";
import openProps from "open-props";
import type { FC } from "react";
import { tokens } from "#@/styles/tokens";

const Wrapper = styled("footer")`
  display: grid;
  row-gap: .2em;
  background-color: ${openProps.gray1};
  padding: .4em;
`;

const Info = styled("span")`
  text-align: center;
  font-size: ${openProps.fontSize0};
`;

const GoToExternal = styled("a")`
  color: ${tokens.colors.accent};
`;

export const Footer: FC = () => {
  return (
    <Wrapper>
      <Info>
        This site is built with{" "}
        <GoToExternal
          href="https://rakkasjs.org"
          target="_blank"
          rel="noreferrer"
        >
          Rakkas
        </GoToExternal>{" "}
        and styled with{" "}
        <GoToExternal
          href="https://github.com/tkamenoko/casablanca-css"
          target="_blank"
          rel="noreferrer"
        >
          casablanca-css
        </GoToExternal>{" "}
        and{" "}
        <GoToExternal
          href="https://open-props.style"
          target="_blank"
          rel="noreferrer"
        >
          Open Props
        </GoToExternal>
        .
      </Info>
      <Info>
        casablanca-css is made by{" "}
        <GoToExternal
          href="https://github.com/tkamenoko"
          target="_blank"
          rel="noreferrer"
        >
          @tkamenoko
        </GoToExternal>
        .
      </Info>
      <Info>MIT License.</Info>
    </Wrapper>
  );
};
