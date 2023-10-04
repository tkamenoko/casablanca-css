import type { TaggedStyle } from './types';

export function css(
  strings: TemplateStringsArray,
  ...vars: (string | number)[]
): TaggedStyle<string> {
  if (import.meta.env.DEV) {
    const s = strings.reduce((prev, current, index) => {
      return prev + current + (vars[index] ?? '');
    }, '');

    return s as TaggedStyle<string>;
  }
  throw new Error('This function is not for runtime execution.');
}
