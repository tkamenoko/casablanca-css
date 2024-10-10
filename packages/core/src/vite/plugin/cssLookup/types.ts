import type { ResolvedCssModuleId } from "#@/vite/resolvedCssModuleId";
import type { ResolvedGlobalStyleId } from "#@/vite/resolvedGlobalStyleId";
import type { VirtualCssModuleId } from "#@/vite/virtualCssModuleId";
import type { VirtualGlobalStyleId } from "#@/vite/virtualGlobalStyleId";

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
