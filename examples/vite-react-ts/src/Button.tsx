import { useState } from 'react';
import type { ComponentProps, FC } from 'react';

export const Button: FC<ComponentProps<'button'>> = (props) => {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount((prev) => prev + 1)} {...props}>
      Count: {count}
    </button>
  );
};
