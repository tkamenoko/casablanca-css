import { css } from "@macrostyles/core";
import type { TaggedStyle } from "@macrostyles/utils";
import { modularScale } from "polished";
import type { FC } from "react";
import { Component, composedStyle } from "./composed";
import { composedStyle as anotherComposedStyle } from "./deps/composed";

export const styleA = css`
  color: red;
`;

const _styledLocalComponent = css`
  display: block;
`;
const LocalComponent = (() => (
  <div className={_styledLocalComponent}>Foo</div>
)) as unknown as TaggedStyle<FC>;
LocalComponent.__modularizedClassName = _styledLocalComponent;
LocalComponent.__rawClassName = "_styledLocalComponent";

export const styleB = css`
  font-size: ${modularScale(3)};
  composes: ${[
    styleA,
    composedStyle,
    anotherComposedStyle,
    Component,
    LocalComponent,
  ]};

  .${LocalComponent.__rawClassName} {
    margin: auto;
  }
  :global(.${Component.__modularizedClassName ?? ""}) {
    margin: 0;
  }
`;
