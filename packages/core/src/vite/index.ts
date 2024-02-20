import type { Plugin } from "vite";
import { plugin } from "./plugin";
import type { PluginOption } from "./types";

export function casablanca(options?: Partial<PluginOption>): Plugin {
  return plugin(options);
}
