import vm from 'node:vm';
import type { ModuleLinker } from 'node:vm';

export const baseLinker: (
  load: (id: string) => Promise<Record<string, unknown>>
) => ModuleLinker = (load) => async (specifier, referencingModule) => {
  const imported = await load(specifier);
  const exportNames = Object.keys(imported);

  const m = new vm.SyntheticModule(
    exportNames,
    () => {
      exportNames.forEach((name) => m.setExport(name, imported[name]));
    },
    { context: referencingModule.context }
  );
  return m;
};
