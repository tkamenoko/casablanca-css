import vm from "node:vm";

type InitializeImportMeta = (
  meta: ImportMeta,
  module: vm.SourceTextModule,
) => void;

type BuildInitializeImportMetaArgs = {
  importMeta: Record<string, unknown>;
  contextifiedObject: vm.Context;
};

export function buildInitializeImportMeta({
  contextifiedObject,
  importMeta,
}: BuildInitializeImportMetaArgs): InitializeImportMeta {
  const initializeImportMeta = (meta: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(importMeta)) {
      meta[key] = vm.runInContext(JSON.stringify(value), contextifiedObject);
    }
  };
  return initializeImportMeta as unknown as InitializeImportMeta;
}
