import type { VirtualModuleId } from '@/types';
import { buildCssImportId } from '@/vite/helpers/buildCssImportId';

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
  importId: VirtualModuleId;
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
    importId: buildCssImportId({ importerPath, projectRoot }),
    style: styles.join(''),
  };
}
