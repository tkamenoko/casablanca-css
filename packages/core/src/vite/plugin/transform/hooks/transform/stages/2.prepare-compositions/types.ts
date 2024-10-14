import type { types } from "@babel/core";
import type { ResolvedCssModuleId } from "#@/vite/types/resolvedCssModuleId";
import type { ComposeInternalArg } from "../3.evaluate-module/createComposeInternal";

export type UuidToStylesMap = Map<
  string,
  {
    resolvedId: ResolvedCssModuleId | null;
    varName: string;
    className: string;
  }
>;

export type EmbeddedToClassNameMap = Map<
  string,
  { className: string; cssId: ResolvedCssModuleId; uuid: string }
>;

export type ComposeArg = Omit<ComposeInternalArg, "value"> & {
  valueId: types.Identifier;
};
