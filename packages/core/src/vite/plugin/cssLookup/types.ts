"#@/vite/virtualGlobalStyleId";

import type { ResolvedCssModuleId } from "#@/vite/types/resolvedCssModuleId";
import type { ResolvedGlobalStyleId } from "#@/vite/types/resolvedGlobalStyleId";
import type { VirtualCssModuleId } from "#@/vite/types/virtualCssModuleId";
import type { VirtualGlobalStyleId } from "#@/vite/types/virtualGlobalStyleId";

export type CssModulesLookup = Map<
  ResolvedCssModuleId,
  {
    style: string;
    map: string | null;
    classNameToStyleMap: Map<string, { style: string }>;
  }
>;
export type JsToCssModuleLookup = Map<
  string,
  {
    virtualId: VirtualCssModuleId;
    resolvedId: ResolvedCssModuleId;
    style: string;
  }
>;

export type GlobalStylesLookup = Map<
  ResolvedGlobalStyleId,
  {
    style: string;
    map: string | null;
  }
>;
export type JsToGlobalStyleLookup = Map<
  string,
  {
    virtualId: VirtualGlobalStyleId;
    resolvedId: ResolvedGlobalStyleId;
    style: string;
  }
>;
