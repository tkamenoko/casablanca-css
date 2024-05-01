import { transformFromAstAsync } from "@babel/core";
import type { ViteDevServer } from "vite";
import { createLinker as createLinkerForProduction } from "./build";
import { evaluate } from "./evaluate";
import { createLinker as createLinkerForServer } from "./serve";
import type { Evaluator, TransformContext } from "./types";

export type { EvaluateModuleReturn } from "./types";

type CreateEvaluatorArgs = {
  modulePath: string;
  server: ViteDevServer | null;
  transformContext: TransformContext;
};

export function createEvaluator({
  server,
  transformContext,
  modulePath,
}: CreateEvaluatorArgs): Evaluator {
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
      });
    };
    return evaluator;
  }
  const { linker } = createLinkerForProduction({
    modulePath,
    transformContext,
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
    });
  };
  return evaluator;
}
