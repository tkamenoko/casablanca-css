import type { Plugin } from "vite";
import { resolveCssModuleId } from "./hooks/resolveId/resolveCssModuleId";
import { resolveGlobalStyleId } from "./hooks/resolveId/resolveGlobalStyleId";

export function resolveIdPlugin(): Plugin {
  return {
    name: "casablanca-css:resolve-id",
    resolveId(id) {
      return resolveCssModuleId({ id }) ?? resolveGlobalStyleId({ id });
    },
  };
}
