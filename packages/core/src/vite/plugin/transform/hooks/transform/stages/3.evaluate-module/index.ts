import { transformFromAstAsync } from "@babel/core";
import { evaluate } from "@casablanca-css/eval";
import {
  nodeBuiltinLoader,
  nodeModuleLoader,
} from "@casablanca-css/eval/loaders";
import type { ViteDevServer } from "vite";
import { collectEvaluatedStyles } from "./collectEvaluatedStyles";
import { createComposeInternal } from "./createComposeInternal";
import { createDevLoaders } from "./createDevLoaders";
import { createGlobalContext } from "./createGlobalContext";
import { createProdLoaders } from "./createProdLoaders";
import { injectReactRefresh } from "./injectReactRefresh";
import { merge } from "./merge";
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

  const evaluator: Evaluator = async ({
    ast,
    capturedVariableNames,
    temporalGlobalStyles,
    uuidToStylesMap,
  }) => {
    // ast to code
    const { code } = (await transformFromAstAsync(ast)) ?? {};
    if (!code) {
      throw new Error("Failed");
    }

    // prepare globals and import meta
    const globalPropertyNames = Object.getOwnPropertyNames(
      globalThis,
    ) as (keyof Global)[];
    const currentGlobals = Object.fromEntries(
      globalPropertyNames.map((n) => [n, globalThis[n]]),
    );
    const { injected: injectedCode, reactGlobals } = injectReactRefresh(code);

    // prepare loaders
    const additionalLoaders = server
      ? createDevLoaders(server)
      : createProdLoaders(transformContext);
    const loaders = [nodeBuiltinLoader, nodeModuleLoader, ...additionalLoaders];
    const evaluatedNamespace = await evaluate({
      code: injectedCode,
      loaders,
      modulePath,
      globals: {
        ...currentGlobals,
        ...reactGlobals,
        __composeInternal: createComposeInternal(uuidToStylesMap),
        ...createGlobalContext(),
        ...globals,
      },
      importMeta,
    });
    // collect styles from evaluated result
    const styles = collectEvaluatedStyles({
      capturedVariableNames,
      evaluatedNamespace,
      temporalGlobalStyles,
    });
    return styles;
  };

  return evaluator;
}
