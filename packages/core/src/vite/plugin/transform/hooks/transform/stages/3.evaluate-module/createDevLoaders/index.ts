import type { Loader } from "@casablanca-css/eval/loaders";
import type { ViteDevServer } from "vite";
import { reactRefreshLoader } from "./reactRefreshLoader";
import { createRelativeLoader } from "./relativeLoader";
import { createViteModuleLoader } from "./viteModuleLoader";

export function createDevLoaders(server: ViteDevServer): Loader[] {
  return [
    reactRefreshLoader,
    createViteModuleLoader(server),
    createRelativeLoader(server),
  ];
}
