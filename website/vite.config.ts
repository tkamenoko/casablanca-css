import { casablanca } from "@casablanca-css/core/vite";
import { casablancaStyled } from "@casablanca-css/styled/vite";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import postcssNested from "postcss-nested";
import rakkas from "rakkasjs/vite-plugin";
import rehypePrettyCode, { type Options } from "rehype-pretty-code";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  css: {
    postcss: { plugins: [postcssNested()] },
    devSourcemap: true,
  },
  plugins: [
    tsconfigPaths(),
    react(),
    {
      ...mdx({
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
        rehypePlugins: [
          [
            rehypePrettyCode,
            { theme: "one-dark-pro", keepBackground: true } satisfies Options,
          ],
        ],
        providerImportSource: "@mdx-js/react",
      }),
      enforce: "pre",
      name: "custom-mdx",
    },
    casablancaStyled(),
    casablanca({ evaluateOptions: { globals: { rakkas: {} } } }),
    rakkas({ prerender: true }),
  ],
});
