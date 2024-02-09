const macrostylesSymbol = Symbol("macrostyles");

export type TaggedStyle<T> = T & {
  [macrostylesSymbol]: unknown;
  __rawClassName?: string;
  __modularizedClassName?: string;
};
