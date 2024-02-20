import type { TaggedStyle } from "@casablanca/utils";

export function css(
  strings: TemplateStringsArray,
  ...vars: (string | number | TaggedStyle<unknown> | TaggedStyle<unknown>[])[]
): TaggedStyle<string> {
  if (import.meta.env.DEV) {
    const s = strings.reduce((prev, current, index) => {
      return prev + current + (vars[index] ?? "");
    }, "");

    return s as TaggedStyle<string>;
  }
  throw new Error("This function is not for runtime execution.");
}
