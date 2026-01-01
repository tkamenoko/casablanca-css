const reactRefreshScriptMock = /* js */ `
import RefreshRuntime from '/@react-refresh';
RefreshRuntime.injectIntoGlobalHook(window);
import.meta.hot = false;
`;

const reactRefreshPattern =
  /import\s+(\* as )?RefreshRuntime\s+from\s+["']\/@react-refresh["'];/gm;

export function injectReactRefresh(code: string): {
  injected: string;
  reactGlobals: Partial<{
    $RefreshReg$: () => void;
    $RefreshSig$: () => <T>(t: T) => T;
    __vite_plugin_react_preamble_installed__: true;
  }>;
} {
  if (code.match(reactRefreshPattern)) {
    return {
      injected: code.replace(reactRefreshPattern, reactRefreshScriptMock),
      reactGlobals: {
        $RefreshReg$: () => {},
        $RefreshSig$: () => (t) => t,
        __vite_plugin_react_preamble_installed__: true,
      },
    };
  }
  return { injected: code, reactGlobals: {} };
}
