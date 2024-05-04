import type { CreateClassNamesFromComponentsReturn } from "#@/stages/1.create-classNames-for-components";
import type { ModifyEmbeddedComponentsReturn } from "#@/stages/2.modify-embedded-components";

export type StageResults = {
  1: CreateClassNamesFromComponentsReturn;
  2: ModifyEmbeddedComponentsReturn;
};

export type TransformResult = {
  id: string;
  transformed: string;
  stages: StageResults;
};

export type OnExitTransform = (params: TransformResult) => Promise<void>;
