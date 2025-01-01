import type { Component } from "react";

export type MdxModuleType = { default: Component } & {
  frontmatter?: Partial<DocsMeta>;
};

export type DocsMeta = {
  title: string;
  slug: string;
  nextSlug?: string | undefined;
  previousSlug?: string | undefined;
};

export function slugToPath(slug: string): string {
  return slug === "/" ? "/docs" : `/docs${slug}`;
}
