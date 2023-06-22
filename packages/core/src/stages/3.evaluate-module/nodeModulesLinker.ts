import vm from 'node:vm';
import type { ModuleLinker } from 'node:vm';

export const nodeModuleLinker: ModuleLinker = async (
  specifier,
  referencingModule
) => {
  const imported = await import(specifier);
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
