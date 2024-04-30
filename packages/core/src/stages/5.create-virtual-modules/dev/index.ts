import { transformFromAstSync, type types } from "@babel/core";
import type { VirtualCssModuleId } from "#@/vite/virtualCssModuleId";
import { buildVirtualCssModuleId } from "#@/vite/virtualCssModuleId";
import type { VirtualGlobalStyleId } from "#@/vite/virtualGlobalStyleId";
import { buildVirtualGlobalStyleId } from "#@/vite/virtualGlobalStyleId";
import { buildCssModule } from "./buildCssModule";

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
    jsClassNamePositions: Map<
      string,
      {
        originalName: string;
        start: { line: number; column: number };
        end: { line: number; column: number };
      }
    >;
  };
};

export type BuildForDevReturn = {
  cssModule: {
    style: string;
    importId: VirtualCssModuleId;
    map: string;
  };
  globalStyle: { style: string; importId: VirtualGlobalStyleId };
};

export function buildForDev({
  evaluatedCssModuleStyles,
  evaluatedGlobalStyles,
  importerPath,
  projectRoot,
  originalInfo: { ast, filename, jsClassNamePositions },
}: BuildForDevArgs): BuildForDevReturn {
  const { code: content } = transformFromAstSync(ast) ?? {};
  if (!content) {
    throw new Error("Unreachable");
  }

  const cssModuleResult = buildCssModule({
    evaluatedCssModuleStyles,
    filename,
    jsClassNamePositions,
    content,
  });

  return {
    cssModule: {
      importId: buildVirtualCssModuleId({ importerPath, projectRoot }),
      style: cssModuleResult.style,
      map: cssModuleResult.map,
    },
    globalStyle: {
      importId: buildVirtualGlobalStyleId({ importerPath, projectRoot }),
      style: evaluatedGlobalStyles.join(""),
    },
  };
}
