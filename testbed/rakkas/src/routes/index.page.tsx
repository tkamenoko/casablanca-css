import type { Page } from 'rakkasjs';
import { styled } from '@macrostyles/react';

const H1Styles = styled('h1')`
  font-size: 2em;
`;

const HomePage: Page = () => {
  return (
    <main>
      <H1Styles>Hello world!</H1Styles>
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
