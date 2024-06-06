import { css } from "@casablanca/core";
import type { TaggedStyle } from "@casablanca/utils";
import openProps from "open-props";
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
  font-size: ${openProps.fontSizeFluid3};
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
