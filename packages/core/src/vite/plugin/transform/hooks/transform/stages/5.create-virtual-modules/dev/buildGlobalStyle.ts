import remapping from "@ampproject/remapping";
import { SourceMapGenerator } from "source-map";
import type { Rollup } from "vite";
import type { GlobalStylePositions } from "../../1.capture-tagged-styles/types";

type BuildGlobalStyleArgs = {
  filename: string;
  content: string;
  projectRoot: string;
  evaluatedGlobalStyles: string[];
  jsGlobalStylePositions: GlobalStylePositions;
  previousSourceMap: Rollup.SourceMap;
};

type BuildGlobalStyleReturn = {
  style: string;
  map: string;
};

export function buildGlobalStyle({
  content,
  filename,
  evaluatedGlobalStyles,
  jsGlobalStylePositions,
  projectRoot,
  previousSourceMap,
}: BuildGlobalStyleArgs): BuildGlobalStyleReturn {
  const relativePath = filename.replace(projectRoot, "").replace(/^\//, "");

  const mapGen = new SourceMapGenerator();
  mapGen.setSourceContent(relativePath, content);

  const result = evaluatedGlobalStyles.reduce<{
    styleParts: string[];
    line: number;
  }>(
    (
      { line, styleParts },
      rawPart,
      index,
    ): { styleParts: string[]; line: number } => {
      const currentPart = rawPart.trim();
      const partLines = currentPart.split("\n").length;
      const originalPosition = jsGlobalStylePositions.at(index);
      if (!originalPosition) {
        throw new Error("global style position was not found.");
      }

      mapGen.addMapping({
        generated: { column: 0, line: line },
        original: {
          ...originalPosition.start,
        },
        source: relativePath,
      });
      mapGen.addMapping({
        generated: { column: 0, line: line + partLines - 1 },
        original: {
          ...originalPosition.end,
        },
        source: relativePath,
      });

      styleParts.push(currentPart);

      return { line: line + partLines, styleParts };
    },
    {
      styleParts: [],
      line: 1,
    },
  );

  const remapped = remapping(
    [JSON.stringify(mapGen.toJSON()), JSON.stringify(previousSourceMap)],
    () => null,
  );

  return {
    map: remapped.toString(),
    style: result.styleParts.join("\n"),
  };
}
