import vm, { type Module } from "node:vm";
import type { ViteDevServer } from "vite";
import type { LoadModuleReturn } from "../../types";

export async function loadReactRefreshModule({
  modulesCache,
  specifier,
  referencingModule,
}: {
  modulesCache: Map<string, Module>;
  specifier: string;
  referencingModule: Module;
  server: ViteDevServer;
  basePath: string;
}): Promise<LoadModuleReturn> {
  if (specifier !== "/@react-refresh") {
    return { error: new Error("This is not /@react-refresh"), module: null };
  }
  const m = new vm.SyntheticModule(
    ["default"],
    () => {
      m.setExport("default", {
        injectIntoGlobalHook: (..._args: unknown[]) => {},
      });
    },
    {
      context: referencingModule.context,
      identifier: `vm:module<react-refresh>(${specifier})`,
    },
  );
  modulesCache.set(specifier, m);
  return { error: null, module: m };
}
