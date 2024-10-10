import remapping from "@ampproject/remapping";
import { SourceMapGenerator } from "source-map";
import type { Rollup } from "vite";

type BuildCssModuleArgs = {
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
  projectRoot: string;
  filename: string;
  previousSourceMap: Rollup.SourceMap;
  content: string;
};

type BuildCssModuleReturn = {
  style: string;
  map: string;
};

export function buildCssModule({
  evaluatedCssModuleStyles,
  jsClassNamePositions,
  filename,
  projectRoot,
  content,
  previousSourceMap,
}: BuildCssModuleArgs): BuildCssModuleReturn {
  const relativePath = filename.replace(projectRoot, "").replace(/^\//, "");

  const mapGen = new SourceMapGenerator();
  mapGen.setSourceContent(relativePath, content);

  const result = evaluatedCssModuleStyles.reduce<{
    styleParts: string[];
    line: number;
  }>(
    (
      { line, styleParts },
      { originalName, style },
    ): { styleParts: string[]; line: number } => {
      const part = `.${originalName} {${style}}`;
      const partLines = part.split("\n").length;
      const originalPosition = jsClassNamePositions.get(originalName);
      if (!originalPosition) {
        throw new Error(`position "${originalName}" was not found.`);
      }

      mapGen.addMapping({
        generated: { column: 0, line: line },
        original: {
          ...originalPosition.start,
        },
        source: relativePath,
        name: originalName,
      });
      mapGen.addMapping({
        generated: { column: 0, line: line + partLines - 1 },
        original: {
          ...originalPosition.end,
        },
        source: relativePath,
        name: originalName,
      });

      styleParts.push(part);

      return { line: line + partLines, styleParts };
    },
    { styleParts: [], line: 1 },
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
