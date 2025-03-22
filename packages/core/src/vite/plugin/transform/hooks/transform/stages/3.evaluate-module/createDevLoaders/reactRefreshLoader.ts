import vm from "node:vm";
import type { Loader } from "@casablanca-css/eval/loaders";

export const reactRefreshLoader: Loader = async ({
  modulesCache,
  referencingModule,
  specifier,
}) => {
  if (specifier !== "/@react-refresh") {
    return { error: new Error("This is not /@react-refresh"), module: null };
  }
  const cached = modulesCache.get(specifier);
  if (cached) {
    return { error: null, module: cached };
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
};
