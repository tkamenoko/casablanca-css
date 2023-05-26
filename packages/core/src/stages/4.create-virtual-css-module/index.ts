import type { VirtualModuleIdPrefix } from '../../types';

type CreateVirtualCssModuleArgs = {
  importerId: string;
  projectRoot: string;
  evaluatedStyles: {
    variableName: string;
    style: string;
  }[];
};
type CreateVirtualCssModuleReturn = {
  style: string;
  importId: `${VirtualModuleIdPrefix}/${string}`;
};

function buildImportId({
  importerId,
  projectRoot,
}: {
  importerId: string;
  projectRoot: string;
}): `${VirtualModuleIdPrefix}/${string}` {
  const replaced = importerId.replace(projectRoot, '').replace(/^\//, '');
  return `virtual:macrostyles/${replaced}.module.css`;
}

export function createVirtualCssModule({
  evaluatedStyles,
  importerId,
  projectRoot,
}: CreateVirtualCssModuleArgs): CreateVirtualCssModuleReturn {
  const styles = evaluatedStyles.map(({ style, variableName }) => {
    return `
.${variableName} {${style}}
`;
  });
  return {
    importId: buildImportId({ importerId, projectRoot }),
    style: styles.join(''),
  };
}
