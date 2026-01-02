import type { Rollup } from "vite";
import {
  buildVirtualCssModuleId,
  type VirtualCssModuleId,
} from "#@/vite/types/virtualCssModuleId";
import {
  buildVirtualGlobalStyleId,
  type VirtualGlobalStyleId,
} from "#@/vite/types/virtualGlobalStyleId";
import type { GlobalStylePosition } from "../../1.capture-tagged-styles/types";
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
    content: string;
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
    jsGlobalStylePositions: GlobalStylePosition[];
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
    content,
    filename,
    jsClassNamePositions,
    jsGlobalStylePositions,
    previousSourceMap,
  },
}: BuildForDevArgs): BuildForDevReturn {
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
