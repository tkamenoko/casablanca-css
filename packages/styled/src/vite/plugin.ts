import type { TransformOptions } from "@babel/core";
import { parseAsync } from "@babel/core";
import { extractPathAndParamsFromId } from "@casablanca-css/utils";
import type { Plugin, ResolvedConfig } from "vite";
import { transform } from "./hooks/transform";
import type { OnExitTransform } from "./types";

export type PluginOption = {
  babelOptions: TransformOptions;
  extensions: `.${string}`[];
  includes: string[];
};

export function plugin(
  options?: Partial<PluginOption> & {
    onExitTransform?: OnExitTransform;
  },
): Plugin {
  let config: ResolvedConfig | null = null;
  const {
    babelOptions = {},
    extensions = [".js", ".jsx", ".ts", ".tsx"],
    onExitTransform = () => {},
  } = options ?? {};
  const include = new Set(options?.includes ?? []);

  return {
    name: "casablanca-css:styled",
    enforce: "pre",
    async transform(code, id) {
      if (!config) {
        throw new Error("Vite config is not resolved");
      }

      const { path, queries } = extractPathAndParamsFromId(id);
      if (queries.has("raw")) {
        return;
      }
      if (!(include.has(path) || extensions.some((e) => path.endsWith(e)))) {
        // ignore module that is not JS/TS code
        return;
      }
      if (/\/node_modules\//.test(path)) {
        // ignore third party packages
        return;
      }

      const isDev = config.mode === "development";

      const parsed = await parseAsync(code, {
        ...babelOptions,
        parserOpts: {
          plugins: ["jsx", "typescript"],
        },
        ast: true,
        sourceMaps: isDev ? "inline" : false,
      });

      if (!parsed) {
        return;
      }

      const {
        code: resultCode,
        stageResults,
        map,
      } = await transform({
        isDev,
        originalAst: parsed,
        originalCode: code,
      });

      await onExitTransform({
        id,
        transformed: resultCode,
        stages: stageResults,
      });

      return { code: resultCode, map };
    },
    configResolved(config_) {
      config = config_;
    },
  };
}
