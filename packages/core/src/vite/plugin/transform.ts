import { parseAsync } from "@babel/core";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";
import { extractTargetFilePath } from "../helpers/extractTargetFilePath";
import { resolveCssModuleId } from "../hooks/resolveCss/resolveCssModuleId";
import { resolveGlobalStyleId } from "../hooks/resolveCss/resolveGlobalStyleId";
import { transform } from "../hooks/transform";
import type { OnExitTransform, PluginOption } from "../types";
import { type CssLookupApi, cssLookupPluginName } from "./cssLookup";

export function transformPlugin(
  options?: Partial<PluginOption> & {
    onExitTransform?: OnExitTransform;
  },
): Plugin {
  let config: ResolvedConfig | null = null;
  let server: ViteDevServer | null = null;
  const {
    babelOptions = {},
    extensions = [".mjs", ".cjs", ".js", ".jsx", ".mts", ".cts", ".ts", ".tsx"],
    onExitTransform = async () => {},
    evaluateOptions = {},
  } = options ?? {};
  const include = new Set(options?.includes ?? []);

  let cssLookup: CssLookupApi | null = null;

  return {
    name: "casablanca-css:transform",
    async transform(code, id) {
      if (!config) {
        throw new Error("Vite config is not resolved");
      }
      if (!cssLookup) {
        throw new Error(`Plugin ${cssLookupPluginName} was not found.`);
      }

      const path = extractTargetFilePath({ extensions, id, include });
      if (!path) {
        return;
      }

      const isDev = config.mode === "development";

      const parsed = await parseAsync(code, {
        ...babelOptions,
        ast: true,
        sourceMaps: isDev ? "inline" : false,
      });

      if (!parsed) {
        return;
      }

      const transformResult = await transform({
        cssModulesLookupApi: cssLookup.cssModule,
        ctx: this,
        isDev,
        originalAst: parsed,
        path,
        projectRoot: config.root,
        server,
        originalCode: code,
        evaluateOptions,
      });
      if (!transformResult) {
        return;
      }

      const { cssModule, globalStyle, js, stageResults } = transformResult;

      cssLookup.cssModule.register({
        classNameToStyle: new Map(
          cssModule.composedStyles.map(({ style, originalName }) => [
            originalName,
            { style, className: originalName },
          ]),
        ),
        map: cssModule.map || null,
        path,
        style: cssModule.style,
        virtualId: cssModule.importId,
      });
      cssLookup.globalStyle.register({
        path,
        style: globalStyle.style,
        map: globalStyle.map || null,
        virtualId: globalStyle.importId,
      });

      await onExitTransform({
        cssLookupApi: cssLookup,
        path,
        stages: stageResults,
        transformed: js.code,
      });

      return {
        code: js.code,
        map: js.map,
      };
    },
    configResolved(config_) {
      config = config_;

      const cssLookupPlugin = config.plugins.find(
        (p) => p.name === cssLookupPluginName,
      );
      if (!cssLookupPlugin) {
        throw new Error(`Plugin ${cssLookupPluginName} was not found.`);
      }
      cssLookup = cssLookupPlugin.api;
    },
    async configureServer(server_) {
      server = server_;
    },
    resolveId(id) {
      return resolveCssModuleId({ id }) ?? resolveGlobalStyleId({ id });
    },
  };
}
