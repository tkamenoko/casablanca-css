import { styled } from "@casablanca-css/styled";
import openProps from "open-props";
import { StyledLink } from "rakkasjs";
import type { FC } from "react";
import { slugToDocsMeta, slugToPath } from "./docsMeta";
import type { DocsMeta } from "./types";

const homeMeta = slugToDocsMeta.get("/");
if (!homeMeta) {
  throw new Error("Invalid slugs");
}

const coreMeta = slugToDocsMeta.get("/core");
const coreLinks: DocsMeta[] = [];
function collectCoreLinks(meta: DocsMeta | null | undefined) {
  if (!meta) {
    return;
  }
  coreLinks.push(meta);
  if (!meta.nextSlug?.startsWith("/core")) {
    return;
  }
  const next = slugToDocsMeta.get(meta.nextSlug ?? "");
  collectCoreLinks(next);
}

collectCoreLinks(coreMeta);

const styledMeta = slugToDocsMeta.get("/styled");
const styledLinks: DocsMeta[] = [];

function collectStyledLinks(meta: DocsMeta | null | undefined) {
  if (!meta) {
    return;
  }
  styledLinks.push(meta);
  if (!meta.nextSlug?.startsWith("/styled")) {
    return;
  }
  const next = slugToDocsMeta.get(meta.nextSlug ?? "");
  collectStyledLinks(next);
}
collectStyledLinks(styledMeta);
const [coreTop, ...coreRest] = coreLinks;
const [styledTop, ...styledRest] = styledLinks;
if (!(coreTop && styledTop)) {
  throw new Error("Invalid slug");
}

const MenuSwitch = styled("label")`
  line-height: 3rem;
  font-size: ${openProps.fontSize2};
  font-weight: ${openProps.fontWeight6};
  vertical-align: middle;
  padding: 0 0.2em;
  border-bottom: ${openProps.borderSize1} solid ${openProps.gray6};
`;
const SwitchBox = styled("input")`
  display: none;
`;

const SubMenu = styled(StyledLink)`
  font-size: ${openProps.fontSize1};
  font-weight: ${openProps.fontWeight4};
  display: block;

  &:hover {
    background-color: ${openProps.gray4};
  }
`;

const TopMenu = styled(StyledLink)`
  font-size: ${openProps.fontSize3};
  font-weight: ${openProps.fontWeight6};
  display: block;

  &:hover {
    background-color: ${openProps.gray4};
  }
`;

const TopItem = styled("li")``;
const SubItem = styled("li")``;

const SubList = styled("ol")`
  display: grid;
  row-gap: 0.3em;
  list-style: decimal outside;
`;

const TopList = styled("ol")`
  display: grid;
  row-gap: 0.3em;

  & .${SubList} {
    padding-left: 2em;
  }
`;

export const MenuPanel = styled("nav")`
  padding: 1rem;
  & > .${MenuSwitch} {
    display: none;
  }

  @media screen and (width < 800px) {
    padding: 0;
    background-color: ${openProps.gray1};
    border-bottom: ${openProps.borderSize1} solid ${openProps.gray6};
    height: fit-content;
    & > .${TopList} {
      display: none;
    }
    & > .${MenuSwitch} {
      display: block;
    }
    &:has(.${SwitchBox}:checked) > .${TopList} {
      padding: 0.5em 0.3em;
      display: grid;
    }
  }
`;

export const SideMenu: FC = () => {
  return (
    <MenuPanel>
      <MenuSwitch>
        ・ LoC
        <SwitchBox type="checkbox" />
      </MenuSwitch>
      <TopList>
        <TopItem>
          <TopMenu href={slugToPath(homeMeta.slug)}>{homeMeta.title}</TopMenu>
        </TopItem>
        <hr />
        <TopItem>
          <TopMenu href={slugToPath(coreTop.slug)}>{coreTop.title}</TopMenu>
          <SubList>
            {coreRest.map(({ slug, title }) => {
              return (
                <SubItem key={slug}>
                  <SubMenu href={slugToPath(slug)}>{title}</SubMenu>
                </SubItem>
              );
            })}
          </SubList>
        </TopItem>
        <hr />
        <TopItem>
          <TopMenu href={slugToPath(styledTop.slug)}>{styledTop.title}</TopMenu>
          <SubList>
            {styledRest.map(({ slug, title }) => {
              return (
                <SubItem key={slug}>
                  <SubMenu href={slugToPath(slug)}>{title}</SubMenu>
                </SubItem>
              );
            })}
          </SubList>
        </TopItem>
      </TopList>
    </MenuPanel>
  );
};
