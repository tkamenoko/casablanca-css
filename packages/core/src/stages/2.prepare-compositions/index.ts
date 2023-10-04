import { randomUUID } from 'node:crypto';

import { transformAsync } from '@babel/core';

import type { ResolvedModuleId } from '@/types';
import { buildResolvedIdFromJsId } from '@/vite/helpers/buildResolvedIdFromJsId';

import type { ImportSource } from '../1.capture-tagged-styles';

import {
  replaceEmbeddedValuesPlugin,
  type Options,
} from './replaceEmbeddedValues';

type ProcessCompositionsArgs = {
  code: string;
  temporalVariableNames: string[];
  importSources: ImportSource[];
  projectRoot: string;
  resolve: (id: string) => Promise<string | null>;
};
type ProcessCompositionsReturn = {
  transformed: string;
  uuidToStylesMap: Map<
    string,
    {
      resolvedId: ResolvedModuleId | null;
      className: string;
    }
  >;
};

export async function prepareCompositions({
  code,
  temporalVariableNames,
  importSources,
  projectRoot,
  resolve,
}: ProcessCompositionsArgs): Promise<ProcessCompositionsReturn> {
  // create embeddedName-to-className+resolvedId map
  const embeddedToClassNameMap = new Map<
    string,
    { className: string; cssId: ResolvedModuleId; uuid: string }
  >();
  await Promise.all(
    importSources.map(async ({ names, source }) => {
      const resolvedId = await resolve(source);
      if (!resolvedId) {
        return;
      }

      const cssId = buildResolvedIdFromJsId({ jsId: resolvedId, projectRoot });
      for (const { className, localName } of names) {
        embeddedToClassNameMap.set(localName, {
          className,
          cssId,
          uuid: randomUUID(),
        });
      }
    }),
  );

  // replace `compose` calls with `composes: ...;` expressions.
  const uuidToStylesMap = new Map<
    string,
    {
      resolvedId: ResolvedModuleId | null;
      className: string;
    }
  >();
  const pluginOption: Options = {
    temporalVariableNames,
    embeddedToClassNameMap,
    uuidToStylesMap,
  };
  const result = await transformAsync(code, {
    plugins: [[replaceEmbeddedValuesPlugin, pluginOption]],
    sourceMaps: 'inline',
  });
  if (!result) {
    throw new Error('Failed');
  }
  const { code: transformed } = result;
  if (!transformed) {
    throw new Error('Failed');
  }

  return { transformed, uuidToStylesMap };
}
