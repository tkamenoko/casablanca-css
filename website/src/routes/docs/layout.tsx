import { MDXProvider } from "@mdx-js/react";
import { Head, type Layout, StyledLink } from "rakkasjs";
import { slugToDocsMeta } from "./getAllDocs";
import type { DocsMeta } from "./types";

const mdxStyledComponents: Parameters<typeof MDXProvider>[0]["components"] = {
  a: (props) => {
    return <StyledLink {...props} />;
  },
};

const DocsLayout: Layout<
  Record<string, never>,
  {
    document: DocsMeta | null;
    next: DocsMeta | null;
    previous: DocsMeta | null;
  }
> = ({ children, meta }) => {
  if (!meta.document) {
    return (
      <div>
        <Head title="NotFound" />
        <article>
          <p>NotFound</p>
        </article>
      </div>
    );
  }
  return (
    <div>
      <Head title={meta.document.title} />
      <article>
        {/* <DocsHeader {...meta.document} /> */}
        <section>
          <MDXProvider components={mdxStyledComponents}>{children}</MDXProvider>
        </section>
        {/* <DocsFooter next={meta.next} previous={meta.previous} /> */}
      </article>
    </div>
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
  return {
    meta: {
      document: docsMeta,
      next: nextSlug ? slugToDocsMeta.get(nextSlug) || null : null,
      previous: previousSlug ? slugToDocsMeta.get(previousSlug) || null : null,
    },
  };
};

export default DocsLayout;
