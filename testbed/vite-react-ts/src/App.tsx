import { css } from '@macrostyles/core';
import type { FC, ReactElement } from 'react';
import { useState } from 'react';

import reactLogo from './assets/react.svg';

import viteLogo from '/vite.svg';

import './App.css';
import { composed, divBackGround, fontSize } from './values';

const spanStyle = css`
  font-style: italic;
  @media screen and (width > 1500px) {
    font-size: 2em;
  }
`;

const h1Size = css`
  font-size: ${fontSize};
  composes: ${composed};
`;

const cardStyle = css`
  & .${spanStyle} {
    font-weight: bold;
    color: green;
  }
`;

const Counter: FC = () => {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount((count) => count + 1)}>
      <span className={spanStyle}>count is {count}</span>
    </button>
  );
};

function App(): ReactElement {
  return (
    <>
      <div className={divBackGround}>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1 className={h1Size}>Vite + React</h1>
      <div className={`card ${cardStyle}`}>
        <Counter />
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
