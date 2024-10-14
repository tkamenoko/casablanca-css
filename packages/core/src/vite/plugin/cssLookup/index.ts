import { extractPathAndParamsFromId } from "@casablanca-css/utils";
import type { Plugin, ViteDevServer } from "vite";
import {
  type ResolvedCssModuleId,
  buildResolvedCssModuleId,
} from "#@/vite/types/resolvedCssModuleId";
import {
  type ResolvedGlobalStyleId,
  buildResolvedGlobalStyleId,
} from "#@/vite/types/resolvedGlobalStyleId";
import type { VirtualCssModuleId } from "#@/vite/types/virtualCssModuleId";
import type { VirtualGlobalStyleId } from "#@/vite/types/virtualGlobalStyleId";
import { loadCssModule } from "./hooks/load/loadCssModule";
import { loadGlobalStyle } from "./hooks/load/loadGlobalStyle";
import { invalidateModule } from "./invalidateModule";
import type {
  CssModulesLookup,
  GlobalStylesLookup,
  JsToCssModuleLookup,
  JsToGlobalStyleLookup,
} from "./types";

export const cssLookupPluginName = "casablanca-css:css-lookup";

export type CssLookupApi = {
  cssModule: {
    register: (args: {
      virtualId: VirtualCssModuleId;
      style: string;
      classNameToStyle: Map<string, { style: string }>;
      map: string | null;
      path: string;
    }) => void;
    getFromResolvedId: (id: ResolvedCssModuleId) =>
      | {
          style: string;
          map: string | null;
          classNameToStyleMap: Map<string, { style: string }>;
        }
      | undefined;
    getFromJsPath: (path: string) =>
      | {
          virtualId: VirtualCssModuleId;
          resolvedId: ResolvedCssModuleId;
          style: string;
        }
      | undefined;
  };
  globalStyle: {
    register: (args: {
      virtualId: VirtualGlobalStyleId;
      style: string;
      map: string | null;
      path: string;
    }) => void;
    getFromResolvedId: (id: ResolvedGlobalStyleId) =>
      | {
          style: string;
          map: string | null;
        }
      | undefined;
    getFromJsPath: (path: string) =>
      | {
          virtualId: VirtualGlobalStyleId;
          resolvedId: ResolvedGlobalStyleId;
          style: string;
        }
      | undefined;
  };
};

export function cssLookupPlugin(): Plugin {
  let server: ViteDevServer | null = null;

  const cssModulesLookup: CssModulesLookup = new Map();
  const jsToCssModuleLookup: JsToCssModuleLookup = new Map();

  const globalStylesLookup: GlobalStylesLookup = new Map();
  const jsToGlobalStyleLookup: JsToGlobalStyleLookup = new Map();

  const api: CssLookupApi = {
    cssModule: {
      register({ classNameToStyle, map, path, style, virtualId }) {
        const resolvedId = buildResolvedCssModuleId({
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
      },
      getFromResolvedId(id) {
        return cssModulesLookup.get(id);
      },
      getFromJsPath(path) {
        return jsToCssModuleLookup.get(path);
      },
    },
    globalStyle: {
      register({ map, path, style, virtualId }) {
        const resolvedId = buildResolvedGlobalStyleId({
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
      },
      getFromResolvedId(id) {
        return globalStylesLookup.get(id);
      },
      getFromJsPath(path) {
        return jsToGlobalStyleLookup.get(path);
      },
    },
  };

  return {
    name: cssLookupPluginName,
    configureServer(_server) {
      server = _server;
    },
    load(id) {
      return (
        loadCssModule({ cssModulesLookup, id }) ??
        loadGlobalStyle({ globalStylesLookup, id })
      );
    },
    api,
    handleHotUpdate({ modules, server }) {
      const affectedModules = modules.flatMap((m) => {
        const { id } = m;
        if (!id) {
          return [m];
        }
        const { path } = extractPathAndParamsFromId(id);
        const { resolvedId: cssModuleId } =
          api.cssModule.getFromJsPath(path) ?? {};
        const cssModule = cssModuleId
          ? server.moduleGraph.getModuleById(cssModuleId)
          : null;

        const { resolvedId: globalStyleId } =
          api.globalStyle.getFromJsPath(path) ?? {};
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
