import type { FC, JSX, ComponentType } from 'react';
import type { TaggedStyle } from '@macrostyles/utils';

type TagFunction<T> = <P extends object = Record<never, never>>(
  strings: TemplateStringsArray,
  ...vars: (
    | string
    | number
    | ((
        props: T extends ComponentType<infer C> ? C & P : never,
      ) => string | number)
    | TaggedStyle<unknown>
    | TaggedStyle<unknown>[]
  )[]
) => TaggedStyle<T extends ComponentType<infer C> ? FC<C & P> : T>;

type StyleComponent = <C = ComponentType>(
  component: C,
) => C extends ComponentType<infer P> ? TagFunction<ComponentType<P>> : never;
type StyleElement = <C extends keyof JSX.IntrinsicElements>(
  component: C,
) => TagFunction<FC<JSX.IntrinsicElements[C]>>;

type Styled = StyleElement & StyleComponent;

export const styled = (<C>(component: C) => {
  if (import.meta.env.DEV) {
    const f = (): TaggedStyle<typeof component> =>
      component as TaggedStyle<typeof component>;
    return f;
  }
  throw new Error('This function is not for runtime execution.');
}) as Styled;
