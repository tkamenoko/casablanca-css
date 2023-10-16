import type { JSX, ComponentType, FC, ComponentProps, HTMLProps } from 'react';
import type { TaggedStyle } from '@macrostyles/utils';

type TagFunction<T> = (
  strings: TemplateStringsArray,
  ...vars: (string | number | TaggedStyle<unknown> | TaggedStyle<unknown>[])[]
) => TaggedStyle<T>;

type BuiltinElement = keyof JSX.IntrinsicElements;
type CustomElement = `${string}-${string}`;

type Styled = <C>(
  component: C extends ComponentType<infer P>
    ? ComponentType<P>
    : C extends BuiltinElement | CustomElement
    ? C
    : never,
) => C extends BuiltinElement
  ? TagFunction<FC<ComponentProps<C>>>
  : C extends CustomElement
  ? TagFunction<FC<HTMLProps<Element>>>
  : TagFunction<C>;

export const styled = ((component) => {
  if (import.meta.env.DEV) {
    const f = () => component;
    return f;
  }
  throw new Error('This function is not for runtime execution.');
}) as Styled;
