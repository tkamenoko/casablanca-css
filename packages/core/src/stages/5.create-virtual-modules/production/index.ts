import type { VirtualCssModuleId } from "#@/vite/virtualCssModuleId";
import { buildVirtualCssModuleId } from "#@/vite/virtualCssModuleId";
import type { VirtualGlobalStyleId } from "#@/vite/virtualGlobalStyleId";
import { buildVirtualGlobalStyleId } from "#@/vite/virtualGlobalStyleId";

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
      importId: buildVirtualCssModuleId({ importerPath, projectRoot }),
      style: cssModuleStyles.join(""),
      map: null,
    },
    globalStyle: {
      importId: buildVirtualGlobalStyleId({ importerPath, projectRoot }),
      style: evaluatedGlobalStyles.join(""),
    },
  };
}
