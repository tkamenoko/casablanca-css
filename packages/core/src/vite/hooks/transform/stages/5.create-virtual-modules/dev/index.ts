import { transformFromAstSync, type types } from "@babel/core";
import type { Rollup } from "vite";
import type { VirtualCssModuleId } from "#@/vite/virtualCssModuleId";
import { buildVirtualCssModuleId } from "#@/vite/virtualCssModuleId";
import type { VirtualGlobalStyleId } from "#@/vite/virtualGlobalStyleId";
import { buildVirtualGlobalStyleId } from "#@/vite/virtualGlobalStyleId";
import type { GlobalStylePositions } from "../../1.capture-tagged-styles/types";
import { buildCssModule } from "./buildCssModule";
import { buildGlobalStyle } from "./buildGlobalStyle";

export type BuildForDevArgs = {
  importerPath: string;
  projectRoot: string;
  evaluatedCssModuleStyles: {
    originalName: string;
    style: string;
  }[];
  evaluatedGlobalStyles: string[];
  originalInfo: {
    ast: types.File;
    filename: string;
    previousSourceMap: Rollup.SourceMap;
    jsClassNamePositions: Map<
      string,
      {
        originalName: string;
        start: { line: number; column: number };
        end: { line: number; column: number };
      }
    >;
    jsGlobalStylePositions: GlobalStylePositions;
  };
};

export type BuildForDevReturn = {
  cssModule: {
    style: string;
    importId: VirtualCssModuleId;
    map: string;
  };
  globalStyle: { style: string; importId: VirtualGlobalStyleId; map: string };
};

export function buildForDev({
  evaluatedCssModuleStyles,
  evaluatedGlobalStyles,
  importerPath,
  projectRoot,
  originalInfo: {
    ast,
    filename,
    jsClassNamePositions,
    jsGlobalStylePositions,
    previousSourceMap,
  },
}: BuildForDevArgs): BuildForDevReturn {
  const { code: content } = transformFromAstSync(ast) ?? {};
  if (!content) {
    throw new Error("Unreachable");
  }

  const cssModuleResult = evaluatedCssModuleStyles.length
    ? buildCssModule({
        evaluatedCssModuleStyles,
        filename,
        jsClassNamePositions,
        content,
        projectRoot,
        previousSourceMap,
      })
    : { style: "", map: "" };
  const globalStyleResult = evaluatedGlobalStyles.length
    ? buildGlobalStyle({
        content,
        evaluatedGlobalStyles,
        filename,
        jsGlobalStylePositions,
        projectRoot,
        previousSourceMap,
      })
    : { style: "", map: "" };

  return {
    cssModule: {
      importId: buildVirtualCssModuleId({ importerPath, projectRoot }),
      style: cssModuleResult.style,
      map: cssModuleResult.map,
    },
    globalStyle: {
      importId: buildVirtualGlobalStyleId({ importerPath, projectRoot }),
      style: globalStyleResult.style,
      map: globalStyleResult.map,
    },
  };
}
