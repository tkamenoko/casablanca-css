import { SourceMapGenerator } from "source-map";

type BuildCssModuleReturn = {
  style: string;
  map: string;
};

export function buildCssModule({
  evaluatedCssModuleStyles,
  jsClassNamePositions,
  filename,
  content,
}: {
  evaluatedCssModuleStyles: {
    originalName: string;
    style: string;
  }[];
  jsClassNamePositions: Map<
    string,
    {
      originalName: string;
      start: { line: number; column: number };
      end: { line: number; column: number };
    }
  >;
  filename: string;
  content: string;
}): BuildCssModuleReturn {
  const moduleMapGen = new SourceMapGenerator();
  moduleMapGen.setSourceContent(filename, content);

  const result = evaluatedCssModuleStyles.reduce<{
    styleParts: string[];
    line: number;
  }>(
    (
      { line, styleParts },
      { originalName, style },
    ): { styleParts: string[]; line: number } => {
      const part = `
.${originalName} {${style}}
`;
      const partLines = part.split("\n").length;
      const originalPosition = jsClassNamePositions.get(originalName);
      if (!originalPosition) {
        throw new Error(`position "${originalName}" was not found.`);
      }
      moduleMapGen.addMapping({
        generated: { column: 0, line: line + 2 },
        original: {
          ...originalPosition.start,
        },
        source: filename,
        name: originalName,
      });
      moduleMapGen.addMapping({
        generated: { column: 0, line: line + partLines },
        original: {
          ...originalPosition.end,
        },
        source: filename,
        name: originalName,
      });
      styleParts.push(part);
      return { line: line + partLines, styleParts };
    },
    { styleParts: [], line: 0 },
  );
  return { map: moduleMapGen.toString(), style: result.styleParts.join("") };
}
