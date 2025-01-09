import { css } from "@casablanca-css/core";
import { styled } from "@casablanca-css/styled";
import openProps from "open-props";
import { StyledLink } from "rakkasjs";
import type { FC } from "react";
import { tokens } from "#@/styles/tokens";
import { slugToPath } from "./docsMeta";

export type LinkInfo = {
  title: string;
  slug: string;
};

type Props = {
  next: LinkInfo | null;
  previous: LinkInfo | null;
};

const Arrow = styled("span")`
  font-size: ${openProps.fontSize4};
  font-weight: ${openProps.fontWeight6};
  line-height: 1em;
  align-self: flex-end;
`;
const Title = styled("span")`
  font-size: ${openProps.fontSize4};
  font-weight: ${openProps.fontWeight7};
  text-decoration: underline;
`;

const commonLinkStyle = css`
  display: grid;
  text-decoration: none;
  grid-template-rows: auto auto;
  padding: 0.3rem 0.6rem;
  color: ${tokens.colors.accent};
  border: ${openProps.borderSize2} solid currentColor;
  border-radius: ${openProps.radius3};
`;

const NextLink = styled(StyledLink)`
  composes: ${commonLinkStyle};
  & > .${Arrow}{
    text-align: end;
  }
  & > .${Title}{
    text-align: end;
  }
`;
const PreviousLink = styled(StyledLink)`
  composes: ${commonLinkStyle};
`;

const Wrapper = styled("footer")`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  padding: .5rem 0;
  & > .${PreviousLink} {
    grid-column: 1 / 2;
  }
  & > .${NextLink} {
    grid-column: -2 / -1;
  }

  @media screen and (width < 800px) {
      grid-template-columns: 2fr 1fr 2fr;
    }
`;

const GoForward: FC<LinkInfo> = ({ title, slug }) => {
  return (
    <NextLink href={slugToPath(slug)}>
      <Arrow>→</Arrow>
      <Title>{title}</Title>
    </NextLink>
  );
};

const GoBack: FC<LinkInfo> = ({ title, slug }) => {
  return (
    <PreviousLink href={slugToPath(slug)}>
      <Arrow>←</Arrow>
      <Title>{title}</Title>
    </PreviousLink>
  );
};

export const DocsFooter: FC<Props> = ({ next, previous }) => {
  return (
    <Wrapper>
      {previous ? <GoBack {...previous} /> : null}
      {next ? <GoForward {...next} /> : null}
    </Wrapper>
  );
};
