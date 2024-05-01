import { SourceMapGenerator } from "source-map";
import type { GlobalStylePositions } from "../../1.capture-tagged-styles/types";

type BuildGlobalStyle = {
  style: string;
  map: string;
};

export function buildGlobalStyle({
  content,
  filename,
  evaluatedGlobalStyles,
  jsGlobalStylePositions,
}: {
  filename: string;
  content: string;
  evaluatedGlobalStyles: string[];
  jsGlobalStylePositions: GlobalStylePositions;
}): BuildGlobalStyle {
  const mapGen = new SourceMapGenerator();
  mapGen.setSourceContent(filename, content);

  const result = evaluatedGlobalStyles.reduce<{
    styleParts: string[];
    line: number;
  }>(
    (
      { line, styleParts },
      currentPart,
      index,
    ): { styleParts: string[]; line: number } => {
      const partLines = currentPart.split("\n").length;
      const originalPosition = jsGlobalStylePositions.at(index);
      if (!originalPosition) {
        throw new Error("global style position was not found.");
      }

      mapGen.addMapping({
        generated: { column: 0, line: line + 2 },
        original: {
          ...originalPosition.start,
        },
        source: filename,
      });
      mapGen.addMapping({
        generated: { column: 0, line: line + partLines },
        original: {
          ...originalPosition.end,
        },
        source: filename,
      });

      styleParts.push(currentPart);

      return { line: line + partLines, styleParts };
    },
    {
      styleParts: [],
      line: 0,
    },
  );

  return { map: mapGen.toString(), style: result.styleParts.join("") };
}
