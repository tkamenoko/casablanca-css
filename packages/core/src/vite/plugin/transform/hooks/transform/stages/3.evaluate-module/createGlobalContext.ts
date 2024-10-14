import { GlobalWindow } from "happy-dom";

const ignores = ["undefined", "NaN", "global", "globalThis"] as const;
const selfReferences = ["self", "top", "parent", "window"] as const;

type CreateWindowForContextReturn = Omit<
  typeof window,
  (typeof ignores)[number] | number
>;

export function createGlobalContext(): CreateWindowForContextReturn {
  const window = new GlobalWindow();
  const entries = Object.entries(window)
    .filter(
      (
        x,
      ): x is [
        keyof CreateWindowForContextReturn,
        CreateWindowForContextReturn[keyof CreateWindowForContextReturn],
      ] => {
        const [k] = x;
        return !(ignores as readonly string[]).includes(k);
      },
    )
    .map(([k, v]) => {
      if (typeof v === "function" && !k.at(0)?.match(/[A-Z]/)) {
        return [k, v.bind(window)];
      }
      return [k, v];
    });
  for (const key of selfReferences) {
    entries.push([key, window]);
  }
  return Object.fromEntries(entries);
}
