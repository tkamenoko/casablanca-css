import { css } from "@casablanca-css/core";
import { styled } from "@casablanca-css/styled";
import openProps from "open-props";
import { StyledLink } from "rakkasjs";
import type { FC } from "react";
import { tokens } from "#@/styles/tokens";

const Wrapper = styled("header")`
  display: grid;
  container-type: inline-size;
  grid-template-rows: 1fr;
  grid-template-columns: auto 1fr;
  color: ${openProps.gray0};
  background-color: ${tokens.colors.brand};
`;

const GoToHome = styled(StyledLink)`
  font-size: ${openProps.fontSize5};
  font-weight: ${openProps.fontWeight7};
  text-decoration: none;
  padding: .1em;
`;

const Links = styled("nav")`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  column-gap: 1em;
  padding: .1em;
`;

const linkStyle = css`
  font-size: ${openProps.fontSize4};
  font-weight: ${openProps.fontWeight4};
  padding: 0 .1em;
`;

export const Header: FC = () => {
  return (
    <Wrapper>
      <GoToHome href="/">casablanca-css</GoToHome>
      <Links>
        <StyledLink href="/docs" className={linkStyle}>
          docs
        </StyledLink>
        <a
          href="https://github.com/tkamenoko/casablanca-css"
          target="_blank"
          rel="noreferrer"
          className={linkStyle}
        >
          GitHub
        </a>
      </Links>
    </Wrapper>
  );
};
