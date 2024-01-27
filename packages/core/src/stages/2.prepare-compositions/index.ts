import { randomUUID } from 'node:crypto';

import type { types } from '@babel/core';
import { transformFromAstAsync } from '@babel/core';

import { buildResolvedIdFromJsId } from '@/vite/helpers/buildResolvedIdFromJsId';
import type { ResolvedCssModuleId } from '@/vite/types';

import type { ImportSource } from '../1.capture-tagged-styles/types';

import {
  replaceEmbeddedValuesPlugin,
  type Options,
} from './replaceEmbeddedValues';
import type { UuidToStylesMap } from './types';

type PrepareCompositionsArgs = {
  captured: types.File;
  code: string;
  isDev: boolean;
  temporalVariableNames: string[];
  importSources: ImportSource[];
  projectRoot: string;
  resolve: (id: string) => Promise<string | null>;
};

export type PrepareCompositionsReturn = {
  transformed: string;
  ast: types.File;
  uuidToStylesMap: UuidToStylesMap;
};

export async function prepareCompositions({
  captured,
  code,
  temporalVariableNames,
  importSources,
  projectRoot,
  resolve,
  isDev,
}: PrepareCompositionsArgs): Promise<PrepareCompositionsReturn> {
  // create embeddedName-to-className+resolvedId map
  const embeddedToClassNameMap = new Map<
    string,
    { className: string; cssId: ResolvedCssModuleId; uuid: string }
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
  const uuidToStylesMap: UuidToStylesMap = new Map();
  const pluginOption: Options = {
    temporalVariableNames,
    embeddedToClassNameMap,
    uuidToStylesMap,
  };
  const result = await transformFromAstAsync(captured, code, {
    plugins: [[replaceEmbeddedValuesPlugin, pluginOption]],
    sourceMaps: isDev ? 'inline' : false,
    ast: true,
  });
  if (!result) {
    throw new Error('Failed');
  }
  const { code: transformed, ast } = result;
  if (!(transformed && ast)) {
    throw new Error('Failed');
  }

  return { transformed, uuidToStylesMap, ast };
}
