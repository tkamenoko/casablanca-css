import { css } from "@casablanca/core";
import { styled } from "@casablanca/styled";
import openProps from "open-props";
import type { FC } from "react";
import { useState } from "react";

export const StyledButton = styled("button")`
  border: 4px solid ${openProps.green6};
  border-radius: ${openProps.radius3};
`;

const buttonClass = css`
  padding: .5rem 1rem;
  border: 7px solid ${openProps.red8};
  border-radius: ${openProps.radiusBlob3};
`;

export const CustomButton: FC = () => {
  const [count, setCount] = useState(0);
  return (
    <button
      type="button"
      onClick={() => setCount((prev) => prev + 1)}
      className={buttonClass}
    >
      count: {count}
    </button>
  );
};
