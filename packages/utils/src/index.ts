import type { types } from '@babel/core';

export type TaggedStyle<T> = T & {
  __macrostyles: never;
};

export type PlatformHook = (args: {
  code: string;
  ast: types.File;
  isDev: boolean;
}) => Promise<{ code: string; ast: types.File }>;
