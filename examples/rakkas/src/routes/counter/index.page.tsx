import { styled } from "@casablanca/styled";
import { type Page, StyledLink } from "rakkasjs";
import { useState } from "react";

const CountButton = styled("button")`
  border: 3px solid green;
  font-size: 2rem;
`;

const Counter: Page = () => {
  const [count, setCount] = useState(0);
  return (
    <div>
      <StyledLink href="/">Back to top</StyledLink>
      <CountButton onClick={() => setCount((prev) => prev + 1)}>
        count: {count}
      </CountButton>
    </div>
  );
};

export default Counter;
