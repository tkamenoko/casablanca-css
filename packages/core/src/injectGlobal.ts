import type { TaggedStyle } from "@casablanca-css/utils";

export function injectGlobal(
  _strings: TemplateStringsArray,
  ..._vars: (string | number | TaggedStyle<unknown> | TaggedStyle<unknown>[])[]
): void {
  if (import.meta.env.DEV) {
    return;
  }
  throw new Error("This function is not for runtime execution.");
}
