import type { TaggedStyle } from './types';

export function compose(...names: TaggedStyle<unknown>[]): string {
  if (import.meta.env.DEV) {
    return (
      names.reduce((prev, current) => {
        return prev + ' ' + String(current);
      }, 'composes:') + ';'
    );
  }
  throw new Error('This function is not for runtime execution.');
}
