import type { VirtualCssModuleId, VirtualGlobalStyleId } from "#@/vite/types";
import type { CapturedVariableNames } from "../1.capture-tagged-styles/types";

export type Options = {
  cssModule: {
    temporalVariableNames: Set<string>;
    originalToTemporalMap: CapturedVariableNames;
    importId: VirtualCssModuleId;
  };
  globalStyle: {
    temporalVariableNames: string[];
    importId: VirtualGlobalStyleId;
  };
};
