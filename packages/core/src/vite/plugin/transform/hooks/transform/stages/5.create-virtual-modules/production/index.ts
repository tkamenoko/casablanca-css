import {
  type VirtualCssModuleId,
  buildVirtualCssModuleId,
} from "#@/vite/types/virtualCssModuleId";
import {
  type VirtualGlobalStyleId,
  buildVirtualGlobalStyleId,
} from "#@/vite/types/virtualGlobalStyleId";

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
    },
    globalStyle: {
      importId: buildVirtualGlobalStyleId({ importerPath, projectRoot }),
      style: evaluatedGlobalStyles.join(""),
    },
  };
}
