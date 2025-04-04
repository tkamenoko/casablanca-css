import type { TaggedStyle } from "@casablanca-css/utils";
import type { ComponentType, FC, JSX } from "react";

type PropsType =
  | Record<string | number | symbol, unknown>
  | Record<never, never>;

type TagFunction<T extends PropsType> = <
  P extends PropsType = Record<never, never>,
>(
  strings: TemplateStringsArray,
  ...vars: (
    | string
    | number
    | ((props: T & P) => string | number)
    | [(props: T & P) => string | number, string | number]
    | TaggedStyle<unknown>
    | TaggedStyle<unknown>[]
  )[]
) => TaggedStyle<FC<T & P>>;

type StyleComponent = <C = ComponentType>(
  component: C,
) => NoInfer<C> extends ComponentType<infer P extends PropsType>
  ? TagFunction<P>
  : never;
type StyleElement = <C extends keyof JSX.IntrinsicElements>(
  component: C,
) => TagFunction<JSX.IntrinsicElements[NoInfer<C>]>;

type Styled = StyleElement & StyleComponent;

export const styled = (<C>(component: C) => {
  if (import.meta.env.DEV) {
    const f = (): TaggedStyle<typeof component> =>
      component as TaggedStyle<typeof component>;
    return f;
  }
  throw new Error("This function is not for runtime execution.");
}) as Styled;
