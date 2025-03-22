import vm from "node:vm";
import { createLinker } from "./createLinker";
import type { Loader } from "./loaders/types";

export type EvaluateArgs = {
  code: string;
  modulePath: string;
  importMeta?: Record<string, unknown>;
  globals?: Record<string, unknown>;
  loaders: Loader[];
};

export type EvaluateReturn = Record<string, unknown>;

export async function evaluate({
  code,
  modulePath,
  globals = {},
  importMeta = {},
  loaders,
}: EvaluateArgs): Promise<EvaluateReturn> {
  const globalPropertyNames = Object.getOwnPropertyNames(
    globalThis,
  ) as (keyof Global)[];
  const currentGlobals = Object.fromEntries(
    globalPropertyNames.map((n) => [n, globalThis[n]]),
  );
  const contextifiedObject = vm.createContext({
    ...currentGlobals,
    ...globals,
  });

  const { linker } = createLinker({ loaders, importMeta, modulePath });

  const targetModule = new vm.SourceTextModule(code, {
    context: contextifiedObject,
    identifier: "vm:module(*target*)",
    initializeImportMeta: (meta: ImportMeta) => {
      const meta_ = meta as unknown as Record<string, unknown>;
      for (const [key, value] of Object.entries(importMeta)) {
        meta_[key] = vm.runInContext(JSON.stringify(value), contextifiedObject);
      }
    },
  });
  await targetModule.link(linker);

  await targetModule.evaluate();

  return { ...targetModule.namespace };
}
