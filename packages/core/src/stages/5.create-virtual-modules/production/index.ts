import { buildCssModuleImportId } from "#@/vite/helpers/buildCssModuleImportId";
import { buildGlobalStyleImportId } from "#@/vite/helpers/buildGlobalStyleImportId";
import type { VirtualCssModuleId, VirtualGlobalStyleId } from "#@/vite/types";

export type BuildForProductionArgs = {
  importerPath: string;
  projectRoot: string;
  evaluatedCssModuleStyles: {
    originalName: string;
    style: string;
  }[];
  evaluatedGlobalStyles: string[];
  originalInfo: null;
};

export type BuildForProductionReturn = {
  cssModule: {
    style: string;
    importId: VirtualCssModuleId;
    map: null;
  };
  globalStyle: { style: string; importId: VirtualGlobalStyleId };
};

export function buildForProduction({
  evaluatedCssModuleStyles,
  evaluatedGlobalStyles,
  importerPath,
  projectRoot,
}: BuildForProductionArgs): BuildForProductionReturn {
  const cssModuleStyles = evaluatedCssModuleStyles.map(
    ({ style, originalName }) => {
      return `
.${originalName} {${style}}
`;
    },
  );
  return {
    cssModule: {
      importId: buildCssModuleImportId({ importerPath, projectRoot }),
      style: cssModuleStyles.join(""),
      map: null,
    },
    globalStyle: {
      importId: buildGlobalStyleImportId({ importerPath, projectRoot }),
      style: evaluatedGlobalStyles.join(""),
    },
  };
}
