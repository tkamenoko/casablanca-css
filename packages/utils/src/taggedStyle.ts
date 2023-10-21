export type TaggedStyle<T> = T & {
  __macrostyles: never;
  __rawClassName?: string;
  __modularizedClassName?: string;
};
