import { css } from "@macrostyles/core";
import { modularScale } from "polished";
import { styleA as imported } from "./composed";

export const styleB = css`
  composes: ${imported};
  font-size: ${modularScale(2)};
`;
