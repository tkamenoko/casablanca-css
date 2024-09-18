import { styled } from "@casablanca-css/styled";
import openProps from "open-props";
import type { Page } from "rakkasjs";
import { useState } from "react";
import { LinkWithBorder } from "#@/components/link";

const CountButton = styled("button")`
  padding: .5rem 1rem;
  border: 3px solid ${openProps.red4};
  font-size: 2rem;
`;

const Counter: Page = () => {
  const [count, setCount] = useState(0);
  return (
    <>
      <CountButton onClick={() => setCount((prev) => prev + 1)}>
        Count: {count}
      </CountButton>
      <LinkWithBorder href="/">Back to top</LinkWithBorder>
    </>
  );
};

export default Counter;
