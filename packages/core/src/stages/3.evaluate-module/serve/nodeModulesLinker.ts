import type { ModuleLinker } from 'node:vm';
import vm from 'node:vm';

export const nodeModuleLinker: ({
  baseLinker,
  resolveId,
}: {
  baseLinker: ModuleLinker;
  resolveId: (id: string) => Promise<string | null>;
}) => ModuleLinker =
  ({ baseLinker, resolveId }) =>
  async (specifier, referencingModule, extra) => {
    try {
      const imported = await import(specifier);
      const exportNames = Object.keys(imported);
      const m = new vm.SyntheticModule(
        exportNames,
        () => {
          exportNames.forEach((name) => m.setExport(name, imported[name]));
        },
        { context: referencingModule.context },
      );
      return m;
    } catch (error) {
      const resolvedId = await resolveId(specifier);
      if (!resolvedId) {
        throw new Error('NotResolved');
      }
      return await baseLinker(resolvedId, referencingModule, extra);
    }
  };
