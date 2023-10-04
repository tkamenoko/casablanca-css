import type { VirtualModuleId } from '@/types';
import { buildCssImportId } from '@/vite/helpers/buildCssImportId';

type CreateVirtualCssModuleArgs = {
  importerPath: string;
  projectRoot: string;
  evaluatedStyles: {
    variableName: string;
    style: string;
  }[];
};
type CreateVirtualCssModuleReturn = {
  style: string;
  importId: VirtualModuleId;
};

export function createVirtualCssModule({
  evaluatedStyles,
  importerPath,
  projectRoot,
}: CreateVirtualCssModuleArgs): CreateVirtualCssModuleReturn {
  const styles = evaluatedStyles.map(({ style, variableName }) => {
    return `
.${variableName} {${style}}
`;
  });
  return {
    importId: buildCssImportId({ importerPath, projectRoot }),
    style: styles.join(''),
  };
}
