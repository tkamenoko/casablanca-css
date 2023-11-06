const reactRefreshScriptMock = /* js */ `
import RefreshRuntime from '/@react-refresh';
RefreshRuntime.injectIntoGlobalHook(window);
globalThis.$RefreshReg$ = window.$RefreshReg$ = () => {};
globalThis.$RefreshSig$ = window.$RefreshSig$ = () => (type) => type;
globalThis.__vite_plugin_react_preamble_installed__ = window.__vite_plugin_react_preamble_installed__ = true;
import.meta.hot = false;
`;

export function injectReactRefresh(code: string): string {
  return `
${code.replace(
  /import\s+RefreshRuntime\s+from\s+["']\/@react-refresh["'];/gm,
  reactRefreshScriptMock,
)}
`;
}
