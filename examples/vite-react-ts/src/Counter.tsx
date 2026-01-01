import type { ComponentProps, FC } from "react";
import { useState } from "react";

export const Counter: FC<ComponentProps<"button">> = (props) => {
  const [count, setCount] = useState(0);
  return (
    <button
      type="button"
      onClick={() => setCount((prev) => prev + 1)}
      {...props}
    >
      Count: {count}
    </button>
  );
};
