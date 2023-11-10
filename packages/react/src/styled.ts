import type { FC, JSX, ComponentType } from 'react';
import type { TaggedStyle } from '@macrostyles/utils';

type TagFunction<T extends object> = <P extends object = T>(
  strings: TemplateStringsArray,
  ...vars: (
    | string
    | number
    | (<U extends T & P>(props: U) => string | number)
    | TaggedStyle<unknown>
    | TaggedStyle<unknown>[]
  )[]
) => TaggedStyle<FC<T & P>>;

type StyleComponent = <C = ComponentType>(
  component: C,
) => C extends ComponentType<infer P extends object> ? TagFunction<P> : never;
type StyleElement = <C extends keyof JSX.IntrinsicElements>(
  component: C,
) => TagFunction<JSX.IntrinsicElements[C]>;

type Styled = StyleElement & StyleComponent;

export const styled = (<C>(component: C) => {
  if (import.meta.env.DEV) {
    const f = (): TaggedStyle<typeof component> =>
      component as TaggedStyle<typeof component>;
    return f;
  }
  throw new Error('This function is not for runtime execution.');
}) as Styled;
