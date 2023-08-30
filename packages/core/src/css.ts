export function css(
  strings: TemplateStringsArray,
  ...vars: (string | number)[]
): string {
  if (import.meta.env.DEV) {
    return strings.reduce((prev, current, index) => {
      return prev + current + (vars[index] ?? '');
    }, '');
  }
  throw new Error('This function is not for runtime execution.');
}
