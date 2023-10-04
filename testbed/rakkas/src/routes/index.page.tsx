import type { Page } from 'rakkasjs';
import { css } from '@macrostyles/core';

const h1Styles = css`
  font-size: 2em;
`;

const HomePage: Page = () => {
  return (
    <main>
      <h1 className={h1Styles}>Hello world!</h1>
      <p>Welcome to the Rakkas demo page 💃</p>
      <p>
        Try editing the files in <code>src/routes</code> to get started or go to
        the{' '}
        <a href="https://rakkasjs.org" target="_blank" rel="noreferrer">
          website
        </a>
        .
      </p>
      <p>
        You may also check the little <a href="/todo">todo application</a> to
        learn about API endpoints and data fetching.
      </p>
    </main>
  );
};

export default HomePage;
