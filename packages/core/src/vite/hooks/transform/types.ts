import type { CaptureTaggedStylesReturn } from "./stages/1.capture-tagged-styles";
import type { PrepareCompositionsReturn } from "./stages/2.prepare-compositions";
import type { EvaluateModuleReturn } from "./stages/3.evaluate-module";
import type { ReplaceUuidToStylesReturn } from "./stages/4.assign-composed-styles-to-uuid";
import type { CreateVirtualModulesReturn } from "./stages/5.create-virtual-modules";
import type { AssignStylesToCapturedVariablesReturn } from "./stages/6.assign-styles-to-variables";

export type StageResults = {
  1: CaptureTaggedStylesReturn;
  2: PrepareCompositionsReturn;
  3: EvaluateModuleReturn;
  4: ReplaceUuidToStylesReturn;
  5: CreateVirtualModulesReturn;
  6: AssignStylesToCapturedVariablesReturn;
};
