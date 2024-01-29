import { buildCssModuleImportId } from '@/vite/helpers/buildCssModuleImportId';
import { buildGlobalStyleImportId } from '@/vite/helpers/buildGlobalStyleImportId';
import type { VirtualCssModuleId, VirtualGlobalStyleId } from '@/vite/types';

type CreateVirtualModulesArgs = {
  importerPath: string;
  projectRoot: string;
  evaluatedCssModuleStyles: {
    originalName: string;
    temporalVariableName: string;
    style: string;
  }[];
  evaluatedGlobalStyles: string[];
};
export type CreateVirtualModulesReturn = {
  cssModule: {
    style: string;
    importId: VirtualCssModuleId;
  };
  globalStyle: { style: string; importId: VirtualGlobalStyleId };
};

export function createVirtualModules({
  evaluatedCssModuleStyles,
  evaluatedGlobalStyles,
  importerPath,
  projectRoot,
}: CreateVirtualModulesArgs): CreateVirtualModulesReturn {
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
      style: cssModuleStyles.join(''),
    },
    globalStyle: {
      importId: buildGlobalStyleImportId({ importerPath, projectRoot }),
      style: evaluatedGlobalStyles.join(''),
    },
  };
}
