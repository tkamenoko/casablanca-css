const casablancaSymbol = Symbol("casablanca");

export type TaggedStyle<T> = T & {
  [casablancaSymbol]: unknown;
  __rawClassName?: string;
  __modularizedClassName?: string;
};
