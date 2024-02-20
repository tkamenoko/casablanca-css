import { css } from "@casablanca/core";
import type { TaggedStyle } from "@casablanca/utils";
import type { FC } from "react";
import { anotherComposedStyle } from "./deps/composed";

export const composedStyle = css`
  display: flex;
  composes: ${anotherComposedStyle};
`;

const _styledComponent = css`
  font-weight: bold;
`;
export const Component = (() => (
  <div className={_styledComponent}>Foo</div>
)) as unknown as TaggedStyle<FC>;
Component.__modularizedClassName = _styledComponent;
Component.__rawClassName = "_styledComponent";
