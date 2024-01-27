import { buildCssModuleImportId } from '@/vite/helpers/buildCssImportId';
import type { VirtualCssModuleId } from '@/vite/types';

type CreateVirtualCssModuleArgs = {
  importerPath: string;
  projectRoot: string;
  evaluatedStyles: {
    originalName: string;
    temporalVariableName: string;
    style: string;
  }[];
};
export type CreateVirtualCssModuleReturn = {
  style: string;
  importId: VirtualCssModuleId;
};

export function createVirtualCssModule({
  evaluatedStyles,
  importerPath,
  projectRoot,
}: CreateVirtualCssModuleArgs): CreateVirtualCssModuleReturn {
  const styles = evaluatedStyles.map(({ style, originalName }) => {
    return `
.${originalName} {${style}}
`;
  });
  return {
    importId: buildCssModuleImportId({ importerPath, projectRoot }),
    style: styles.join(''),
  };
}
