type CssString = string & {};

export function css(
  strings: TemplateStringsArray,
  ...vars: string[]
): CssString {
  return 'noop';
}
