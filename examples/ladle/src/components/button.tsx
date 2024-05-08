import { css } from "@casablanca/core";
import { styled } from "@casablanca/styled";
import type { FC } from "react";
import { useState } from "react";

export const StyledButton = styled("button")`
  border: 1px solid green;
`;

const buttonClass = css`
  border: 1px solid red;
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
