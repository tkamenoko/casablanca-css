import type { Plugin } from "vite";
import type { OnExitTransform, PluginOption } from "../types";
import { cssLookupPlugin } from "./cssLookup";
import { transformPlugin } from "./transform";

export function plugin(
  options?: Partial<PluginOption> & {
    onExitTransform?: OnExitTransform;
  },
): Plugin[] {
  return [transformPlugin(options), cssLookupPlugin()];
}