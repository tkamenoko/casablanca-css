import { GlobalWindow } from 'happy-dom';

export const createGlobalContext = (): Record<string, unknown> => {
  const w = new GlobalWindow();
  const selfReference = ['self', 'top', 'parent', 'window'];
  const r: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(w)) {
    if (r[k] === v) {
      continue;
    }
    r[k] = v;
  }

  for (const key of selfReference) {
    r[key] = undefined;
  }
  return r;
};

const registerGlobals = /* js */ `
{
  for (const [k,v] of Object.entries(globalThis)) {
    if (typeof v === "function" && k.at(0).match(/[A-Z]/)) {
      globalThis[k] = v.bind(globalThis)
    }
  }
  const selfReference = ['self', 'top', 'parent', 'window'];
  for (const key of selfReference) {
    globalThis[key] = globalThis;
  }
}
`;

export function injectRegisterGlobals(code: string): string {
  return `\
${registerGlobals}
${code}
`;
}
