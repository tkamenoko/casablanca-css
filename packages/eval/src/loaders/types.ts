import type { Module } from "node:vm";

export type LoaderFailed = { error: Error; module: null };
export type LoaderOk = { error: null; module: Module };

export type LoaderReturn = LoaderFailed | LoaderOk;

export type LoaderArgs = {
  basePath: string;
  modulesCache: Map<string, Module>;
  referencingModule: Module;
  specifier: string;
  importMeta: Record<string, unknown>;
};

export type Loader = (args: LoaderArgs) => Promise<LoaderReturn>;
