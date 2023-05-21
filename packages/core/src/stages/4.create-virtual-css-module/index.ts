import type { VirtualModuleIdPrefix } from '../../types';

type CreateVirtualCssModuleArgs = {
  importerId: string;
  evaluatedStyles: Iterable<{
    variableName: string;
    style: string;
  }>;
};
type CreateVirtualCssModuleReturn = {
  style: string;
  importId: `${VirtualModuleIdPrefix}/${string}`;
};

export function createVirtualCssModule(
  params: CreateVirtualCssModuleArgs
): CreateVirtualCssModuleReturn {
  throw new Error('TODO!');
}
