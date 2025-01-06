import { styled } from "@casablanca-css/styled";
import { MDXProvider } from "@mdx-js/react";
import openProps from "open-props";
import { Head, type Layout, ResponseHeaders, StyledLink } from "rakkasjs";
import { slugToDocsMeta } from "./docsMeta";
import { DocsFooter, type LinkInfo } from "./footer";
import { MenuPanel, SideMenu } from "./sideMenu";
import type { DocsMeta } from "./types";

const H1 = styled("h1")`
  font-size: ${openProps.fontSize6};
`;
const H2 = styled("h2")`
  font-size: ${openProps.fontSize4};
`;
const Ul = styled("ul")`
  list-style: disc inside;
  
`;

const mdxStyledComponents: Parameters<typeof MDXProvider>[0]["components"] = {
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

const MainPanel = styled("article")`
  padding: 0.3rem 0.5rem;
  display: grid;
  grid-template-rows: auto 1fr;
  row-gap: 1rem;
  align-items: start;

  & *:not(pre) > code {
    padding: 0 0.2em;
    background-color: ${openProps.gray3};
  }



 & figcaption{
  width: min-content;
  border: ${openProps.borderSize1} solid ${openProps.gray11};
  border-radius: ${openProps.radius2} ${openProps.radius2} 0 0;
  border-bottom: none;
  padding: 0 .3em;
  line-height: 1.8em;
  font-size: ${openProps.fontSize0};
  
 }

  & pre {
    /* WORKAROUND: fix after inline style bug */
    padding: .8em 1.5em;
    position: relative;
    border-radius: ${openProps.radius2};

    &[title] {
    border-top-left-radius: 0;}
  }
`;

const DocsBody = styled("section")`
  display: grid;
  row-gap: 0.5rem;
`;

const DocsWrapper = styled("div")`
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(15rem, 1fr) 3fr minmax(15rem, 1fr);
  column-gap: 1em;
  & > .${MainPanel} {
    grid-column: 2 / 3;
  }
  & > .${MenuPanel} {
    grid-column: 1 / 2;
  }
`;

const DocsLayout: Layout<
  Record<string, never>,
  {
    document: DocsMeta | null;
    next: LinkInfo | null;
    previous: LinkInfo | null;
  }
> = ({ children, meta }) => {
  if (!meta.document) {
    return (
      <DocsWrapper>
        <ResponseHeaders status={404} />
        <Head title="NotFound" />
        <SideMenu />
        <MainPanel>
          <p>NotFound</p>
        </MainPanel>
      </DocsWrapper>
    );
  }
  return (
    <DocsWrapper>
      <Head title={`${meta.document.title} | casablanca-css documentation`} />
      <SideMenu />
      <MainPanel>
        {/* <DocsHeader {...meta.document} /> */}
        <DocsBody>
          <MDXProvider components={mdxStyledComponents}>{children}</MDXProvider>
        </DocsBody>
        <DocsFooter next={meta.next} previous={meta.previous} />
      </MainPanel>
    </DocsWrapper>
  );
};

DocsLayout.preload = async ({ url }) => {
  const pathname = url.pathname;
  const slug = pathname.replace(/^\/docs\/?/, "/");
  const docsMeta = slugToDocsMeta.get(slug);
  if (!docsMeta) {
    return {
      meta: { document: null, next: null, previous: null },
    };
  }
  const { nextSlug, previousSlug } = docsMeta;
  const nextMeta = nextSlug ? slugToDocsMeta.get(nextSlug) : null;
  const previousMeta = previousSlug ? slugToDocsMeta.get(previousSlug) : null;
  return {
    meta: {
      document: docsMeta,
      next: nextMeta ? { slug: nextMeta.slug, title: nextMeta.title } : null,
      previous: previousMeta
        ? { slug: previousMeta.slug, title: previousMeta.title }
        : null,
    },
  };
};

export default DocsLayout;
