import type { VirtualCssModuleId, VirtualGlobalStyleId } from '@/vite/types';

import type { CapturedVariableNames } from '../1.capture-tagged-styles';

export type Options = {
  cssModule: {
    temporalVariableNames: CapturedVariableNames;
    originalToTemporalMap: CapturedVariableNames;
    importId: VirtualCssModuleId;
  };
  globalStyle: {
    temporalVariableNames: string[];
    importId: VirtualGlobalStyleId;
  };
};
