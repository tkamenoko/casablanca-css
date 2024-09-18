import { parseAsync } from "@babel/core";
import { extractPathAndParamsFromId } from "@casablanca-css/utils";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";
import { extractTargetFilePath } from "./helpers/extractTargetFilePath";
import { invalidateModule } from "./helpers/invalidateModule";
import { loadCssModule } from "./hooks/loadCss/loadCssModule";
import { loadGlobalStyle } from "./hooks/loadCss/loadGlobalStyle";
import { resolveCssModuleId } from "./hooks/resolveCss/resolveCssModuleId";
import { resolveGlobalStyleId } from "./hooks/resolveCss/resolveGlobalStyleId";
import { transform } from "./hooks/transform";
import { buildResolvedCssModuleIdFromVirtualCssModuleId } from "./resolvedCssModuleId";
import { buildResolvedGlobalStyleIdFromVirtualGlobalStyleId } from "./resolvedGlobalStyleId";
import type {
  CssModulesLookup,
  GlobalStylesLookup,
  JsToCssModuleLookup,
  JsToGlobalStyleLookup,
  OnExitTransform,
  PluginOption,
} from "./types";
import type { VirtualCssModuleId } from "./virtualCssModuleId";
import type { VirtualGlobalStyleId } from "./virtualGlobalStyleId";

export function plugin(
  options?: Partial<PluginOption> & {
    onExitTransform?: OnExitTransform;
  },
): Plugin {
  const cssModulesLookup: CssModulesLookup = new Map();
  const jsToCssModuleLookup: JsToCssModuleLookup = new Map();

  const globalStylesLookup: GlobalStylesLookup = new Map();
  const jsToGlobalStyleLookup: JsToGlobalStyleLookup = new Map();

  let config: ResolvedConfig | null = null;
  let server: ViteDevServer | null = null;
  const {
    babelOptions = {},
    extensions = [".mjs", ".cjs", ".js", ".jsx", ".mts", ".cts", ".ts", ".tsx"],
    onExitTransform = async () => {},
    evaluateOptions = {},
  } = options ?? {};
  const include = new Set(options?.includes ?? []);

  const registerCssModule = ({
    virtualId,
    style,
    classNameToStyle,
    map,
    path,
  }: {
    virtualId: VirtualCssModuleId;
    style: string;
    classNameToStyle: Map<string, { style: string }>;
    map: string | null;
    path: string;
  }): void => {
    const resolvedId = buildResolvedCssModuleIdFromVirtualCssModuleId({
      id: virtualId,
    });
    cssModulesLookup.set(resolvedId, {
      style,
      classNameToStyleMap: classNameToStyle,
      map,
    });
    jsToCssModuleLookup.set(path, {
      resolvedId,
      virtualId,
      style,
    });
    if (server) {
      invalidateModule({ moduleId: resolvedId, server });
    }
  };

  const registerGlobalStyle = ({
    virtualId,
    style,
    map,
    path,
  }: {
    virtualId: VirtualGlobalStyleId;
    style: string;
    map: string | null;
    path: string;
  }): void => {
    const resolvedId = buildResolvedGlobalStyleIdFromVirtualGlobalStyleId({
      id: virtualId,
    });
    globalStylesLookup.set(resolvedId, {
      style,
      map,
    });
    jsToGlobalStyleLookup.set(path, {
      resolvedId,
      virtualId,
      style,
    });
    if (server) {
      invalidateModule({ moduleId: resolvedId, server });
    }
  };

  return {
    name: "casablanca",
    async transform(code, id) {
      if (!config) {
        throw new Error("Vite config is not resolved");
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
        cssModulesLookup,
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

      registerCssModule({
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
      registerGlobalStyle({
        path,
        style: globalStyle.style,
        map: globalStyle.map || null,
        virtualId: globalStyle.importId,
      });

      await onExitTransform({
        cssModulesLookup,
        globalStylesLookup,
        jsToCssModuleLookup,
        jsToGlobalStyleLookup,
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
    },
    async configureServer(server_) {
      server = server_;
    },
    resolveId(id) {
      return resolveCssModuleId({ id }) ?? resolveGlobalStyleId({ id });
    },
    load(id) {
      return (
        loadCssModule({ cssModulesLookup, id }) ??
        loadGlobalStyle({ globalStylesLookup, id })
      );
    },
    handleHotUpdate({ modules, server }) {
      const affectedModules = modules.flatMap((m) => {
        const { id } = m;
        if (!id) {
          return [m];
        }
        const { path } = extractPathAndParamsFromId(id);
        const { resolvedId: cssModuleId } = jsToCssModuleLookup.get(path) ?? {};
        const cssModule = cssModuleId
          ? server.moduleGraph.getModuleById(cssModuleId)
          : null;

        const { resolvedId: globalStyleId } =
          jsToGlobalStyleLookup.get(path) ?? {};
        const globalStyle = globalStyleId
          ? server.moduleGraph.getModuleById(globalStyleId)
          : null;

        return [m, cssModule, globalStyle].filter(
          (x): x is NonNullable<typeof x> => !!x,
        );
      });

      return affectedModules;
    },
  };
}
