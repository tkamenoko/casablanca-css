import { css } from "@casablanca-css/core";
import openProps from "open-props";

export const styleWithOpenProps = css`
  border-radius: ${openProps.radiusBlob1};
`;
