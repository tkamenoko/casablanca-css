import type { ModuleLinker } from 'node:vm';
import vm from 'node:vm';

export const nodeModuleLinker: ({
  load,
}: {
  load: (id: string) => Promise<string>;
}) => ModuleLinker =
  ({ load }) =>
  async (specifier, referencingModule) => {
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
      const code = await load(specifier);
      const m = new vm.SourceTextModule(code, {
        context: referencingModule.context,
      });
      return m;
    }
  };
