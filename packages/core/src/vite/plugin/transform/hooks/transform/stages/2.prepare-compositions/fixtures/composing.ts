import { css } from "@casablanca-css/core";
import openProps from "open-props";
import { styleA as imported } from "./composed";

export const styleB = css`
  composes: ${imported};
  font-size: ${openProps.fontSize4};
`;
