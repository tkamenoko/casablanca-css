import type { TransformOptions } from "@babel/core";
import { parseAsync } from "@babel/core";
import { extractPathAndParamsFromId } from "@casablanca/utils";
import type { Plugin, ResolvedConfig } from "vite";
import type { CreateClassNamesFromComponentsReturn } from "#@/stages/1.create-classNames-for-components";
import { createClassNamesFromComponents } from "#@/stages/1.create-classNames-for-components";
import type { ModifyEmbeddedComponentsReturn } from "#@/stages/2.modify-embedded-components";
import { modifyEmbeddedComponents } from "#@/stages/2.modify-embedded-components";

export type PluginOption = {
  babelOptions: TransformOptions;
  extensions: `.${string}`[];
  includes: string[];
};

export type TransformResult = {
  id: string;
  transformed: string;
  stages: {
    1?: CreateClassNamesFromComponentsReturn;
    2?: ModifyEmbeddedComponentsReturn;
  };
};

type OnExitTransform = (params: TransformResult) => Promise<void>;

export function plugin(
  options?: Partial<PluginOption> & {
    onExitTransform?: OnExitTransform;
  },
): Plugin {
  let config: ResolvedConfig | null = null;
  const {
    babelOptions = {},
    extensions = [".js", ".jsx", ".ts", ".tsx"],
    onExitTransform,
  } = options ?? {};
  const include = new Set(options?.includes ?? []);

  return {
    name: "casablanca:react",
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

      const { ast: astWithClassNames, code: codeWithClassNames } =
        await createClassNamesFromComponents({
          ast: parsed,
          code,
          isDev,
        });

      const { code: resultCode } = await modifyEmbeddedComponents({
        ast: astWithClassNames,
        code: codeWithClassNames,
        isDev,
      });

      if (onExitTransform) {
        await onExitTransform({
          id,
          transformed: resultCode,
          stages: {
            "1": { ast: astWithClassNames, code: codeWithClassNames },
            "2": { code: resultCode },
          },
        });
      }

      return resultCode;
    },
    configResolved(config_) {
      config = config_;
    },
  };
}
