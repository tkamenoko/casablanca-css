import type { ResolvedCssModuleId } from "#@/vite/types";

export type UuidToStylesMap = Map<
  string,
  {
    resolvedId: ResolvedCssModuleId | null;
    varName: string;
    className: string;
  }
>;
