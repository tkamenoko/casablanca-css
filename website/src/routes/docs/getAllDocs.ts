import type { DocsMeta, MdxModuleType } from "./types";

const allDocs = import.meta.glob<true, string, MdxModuleType>(
  "./**/*.page.mdx",
  {
    eager: true,
  },
);

const slugToDocsMeta = new Map<string, DocsMeta>();

for (const [path, module] of Object.entries(allDocs)) {
  const slug = path.replace(/\.page\.mdx$/, "");
  const metadata = module.frontmatter;
  if (!metadata) {
    throw new Error(`${slug} has no metadata`);
  }
  const { nextSlug, previousSlug, title } = metadata;
  if (!title) {
    throw new Error(`${slug} has no title`);
  }
  const validatedMeta = { title, nextSlug, previousSlug };
  slugToDocsMeta.set(slug, validatedMeta);
  if (slug.endsWith("/index")) {
    const noIndex = slug.replace(/\/index$/, "");
    slugToDocsMeta.set(noIndex, validatedMeta);
    if (!noIndex) {
      slugToDocsMeta.set("/", validatedMeta);
    }
  }
}

export { slugToDocsMeta };
