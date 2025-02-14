import { css } from "@casablanca-css/core";
import { styled } from "@casablanca-css/styled";
import MenuIcon from "feather-icons/dist/icons/menu.svg";
import CancelIcon from "feather-icons/dist/icons/x.svg";
import openProps from "open-props";
import { StyledLink } from "rakkasjs";
import type { FC } from "react";
import { tokens } from "#@/styles/tokens";

const GoToHome = styled(StyledLink)`
  font-size: ${openProps.fontSize5};
  font-weight: ${openProps.fontWeight7};
  text-decoration: none;
  padding: 0.1em;
`;

const SwitchBox = styled("input")`
  display: none;
`;

const LinkSwitch = styled("label")`
  background-color: ${openProps.gray0};
  height: 100%;
  aspect-ratio: 1 / 1;
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  mask-image: url(${JSON.stringify(MenuIcon)});
  mask-repeat: no-repeat;
  mask-size: contain;
  &:has(.${SwitchBox}:checked) {
    mask-image: url(${JSON.stringify(CancelIcon)});
  }
`;

const Links = styled("nav")`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  column-gap: 1em;
  padding: 0.1em;
`;

const linkStyle = css`
  font-size: ${openProps.fontSize4};
  font-weight: ${openProps.fontWeight4};
  padding: 0 0.1em;
`;

const Wrapper = styled("header")`
  display: grid;
  container-type: inline-size;
  grid-template-rows: 1fr;
  grid-template-columns: auto 1fr;
  color: ${openProps.gray0};
  background-color: ${tokens.colors.brand};
  & > .${LinkSwitch} {
    display: none;
  }

  @media screen and (width < 800px) {
    grid-template-columns: 1fr auto;

    & > .${GoToHome} {
      grid-column: 1 / -1;
      grid-row: 1 / 2;
      text-align: center;
    }

    & > .${LinkSwitch} {
      display: block;
    }

    & > .${Links} {
      display: none;
    }
    &:has(.${SwitchBox}:checked) > .${Links} {
      display: grid;
      grid-column: 1 / -1;
      grid-template-columns: 1fr;
      grid-template-rows: max-content;
      text-align: center;
      color: ${tokens.colors.brand};
      background-color: ${openProps.gray0};

      & > a {
        padding: 0.1em 0;
        border-bottom: ${openProps.borderSize1} solid ${openProps.gray4};
      }
    }
  }
`;

export const Header: FC = () => {
  return (
    <Wrapper>
      <GoToHome href="/">casablanca-css</GoToHome>
      <LinkSwitch>
        <SwitchBox type="checkbox" />
      </LinkSwitch>
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
