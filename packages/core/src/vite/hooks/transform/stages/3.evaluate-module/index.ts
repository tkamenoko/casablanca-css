import { transformFromAstAsync } from "@babel/core";
import type { ViteDevServer } from "vite";
import { createLinker as createLinkerForProduction } from "./build";
import { evaluate } from "./evaluate";
import { merge } from "./merge";
import { createLinker as createLinkerForServer } from "./serve";
import type { EvaluateOptions, Evaluator, TransformContext } from "./types";

export type { EvaluateModuleReturn } from "./types";

type CreateEvaluatorArgs = {
  modulePath: string;
  server: ViteDevServer | null;
  transformContext: TransformContext;
  evaluateOptions: Partial<EvaluateOptions>;
};

const defaultGlobals = {};
const defaultImportMeta = {};

export function createEvaluator({
  server,
  transformContext,
  evaluateOptions,
  modulePath,
}: CreateEvaluatorArgs): Evaluator {
  const globals = merge(defaultGlobals, evaluateOptions.globals ?? {});
  const importMeta = merge(defaultImportMeta, evaluateOptions.importMeta ?? {});
  if (server) {
    const { linker } = createLinkerForServer({
      modulePath,
      server,
    });
    const evaluator: Evaluator = async ({
      ast,
      capturedVariableNames,
      temporalGlobalStyles,
      uuidToStylesMap,
    }) => {
      const { code } = (await transformFromAstAsync(ast)) ?? {};
      if (!code) {
        throw new Error("Failed");
      }
      return await evaluate({
        code,
        linker,
        capturedVariableNames,
        temporalGlobalStyles,
        uuidToStylesMap,
        globals,
        importMeta,
      });
    };
    return evaluator;
  }
  const { linker } = createLinkerForProduction({
    modulePath,
    transformContext,
    importMeta,
  });

  const evaluator: Evaluator = async ({
    ast,
    capturedVariableNames,
    temporalGlobalStyles,
    uuidToStylesMap,
  }) => {
    const { code } = (await transformFromAstAsync(ast)) ?? {};
    if (!code) {
      throw new Error("Failed");
    }
    return await evaluate({
      code,
      linker,
      capturedVariableNames,
      temporalGlobalStyles,
      uuidToStylesMap,
      globals,
      importMeta,
    });
  };
  return evaluator;
}
