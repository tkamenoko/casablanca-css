import type { Loader } from "@casablanca-css/eval/loaders";
import type { TransformContext } from "../types";
import { createAbsoluteLoader } from "./absoluteLoader";
import { createRelativeLoader } from "./relativeLoader";
import { createViteModuleLoader } from "./viteModuleLoader";

export function createProdLoaders(ctx: TransformContext): Loader[] {
  return [
    createViteModuleLoader(ctx),
    createAbsoluteLoader(ctx),
    createRelativeLoader(ctx),
  ];
}
