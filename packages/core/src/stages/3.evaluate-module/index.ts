import type { ViteDevServer } from 'vite';

import type { UuidToStylesMap } from '../2.prepare-compositions/types';

import type { EvaluateModuleReturn, TransformContext } from './types';
import { evaluate } from './evaluate';
import { createLinker as createLinkerForServer } from './serve';
import { createLinker as createLinkerForProduction } from './build';

export type { EvaluateModuleReturn } from './types';

type Evaluator = (args: {
  code: string;
  uuidToStylesMap: UuidToStylesMap;
  temporalVariableNames: Map<
    string,
    {
      originalName: string;
      temporalName: string;
    }
  >;
  temporalGlobalStyles: string[];
}) => Promise<EvaluateModuleReturn>;

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
      code,
      temporalVariableNames,
      temporalGlobalStyles,
      uuidToStylesMap,
    }) => {
      return await evaluate({
        code,
        linker,
        temporalVariableNames,
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
    code,
    temporalVariableNames,
    temporalGlobalStyles,
    uuidToStylesMap,
  }) => {
    return await evaluate({
      code,
      linker,
      temporalVariableNames,
      temporalGlobalStyles,
      uuidToStylesMap,
    });
  };
  return evaluator;
}
