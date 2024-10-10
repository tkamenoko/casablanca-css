import type { Plugin } from "vite";
import type { PluginOption } from "../types";
import { cssLookupPlugin } from "./cssLookup";
import { resolveIdPlugin } from "./resolveId";
import { transformPlugin } from "./transform";
import type { OnExitTransform } from "./transform/types";

export function plugin(
  options?: Partial<PluginOption> & {
    onExitTransform?: OnExitTransform;
  },
): Plugin[] {
  return [transformPlugin(options), cssLookupPlugin(), resolveIdPlugin()];
}
