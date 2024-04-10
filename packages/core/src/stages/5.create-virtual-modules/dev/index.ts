import { transformFromAstSync, type types } from "@babel/core";
import { SourceMapGenerator } from "source-map";
import type { VirtualCssModuleId } from "#@/vite/cssModuleId";
import { buildVirtualCssModuleId } from "#@/vite/cssModuleId";
import { buildGlobalStyleImportId } from "#@/vite/helpers/buildGlobalStyleImportId";
import type { VirtualGlobalStyleId } from "#@/vite/types";

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
    jsPositions: Map<
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
  originalInfo: { ast, filename, jsPositions },
}: BuildForDevArgs): BuildForDevReturn {
  const moduleMapGen = new SourceMapGenerator();
  const { code: content } = transformFromAstSync(ast) ?? {};
  if (!content) {
    throw new Error("Unreachable");
  }
  moduleMapGen.setSourceContent(filename, content);
  const cssModuleStyles = evaluatedCssModuleStyles.map(
    ({ style, originalName }) => {
      return `
.${originalName} {${style}}
`;
    },
  );

  evaluatedCssModuleStyles.reduce<{ styleParts: string[]; line: number }>(
    (
      { line, styleParts },
      { originalName, style },
    ): { styleParts: string[]; line: number } => {
      const part = `
.${originalName} {${style}}
`;
      const partLines = part.split("\n").length;
      const originalPosition = jsPositions.get(originalName);
      if (!originalPosition) {
        throw new Error(`position "${originalName}" was not found.`);
      }
      moduleMapGen.addMapping({
        generated: { column: 0, line: line + 2 },
        original: {
          ...originalPosition.start,
        },
        source: content,
        name: filename,
      });
      moduleMapGen.addMapping({
        generated: { column: 0, line: line + partLines },
        original: {
          ...originalPosition.end,
        },
        source: content,
        name: filename,
      });
      styleParts.push(part);
      return { line: line + partLines, styleParts };
    },
    { styleParts: [], line: 0 },
  );

  return {
    cssModule: {
      importId: buildVirtualCssModuleId({ importerPath, projectRoot }),
      style: cssModuleStyles.join(""),
      map: moduleMapGen.toString(),
    },
    globalStyle: {
      importId: buildGlobalStyleImportId({ importerPath, projectRoot }),
      style: evaluatedGlobalStyles.join(""),
    },
  };
}
