import type { VirtualModuleIdPrefix } from 'src/types';
import type { Plugin } from 'vite';

type ResolvedVirtualModuleIdPrefix = `\0${VirtualModuleIdPrefix}`;
const virtualModuleIdPrefix: VirtualModuleIdPrefix = 'virtual:macrostyles';
const resolvedVirtualModuleIdPrefix: ResolvedVirtualModuleIdPrefix =
  '\0virtual:macrostyles';

function isResolverId(
  p: string
): p is `${ResolvedVirtualModuleIdPrefix}${string}` {
  return p.startsWith(resolvedVirtualModuleIdPrefix);
}

export function macrostyles(): Plugin {
  const virtualModuleIdPrefix: VirtualModuleIdPrefix = 'virtual:macrostyles';
  const resolvedVirtualModuleIdPrefix: ResolvedVirtualModuleIdPrefix =
    '\0virtual:macrostyles';

  const cache = new Map<string, Record<string, string>>();
  // TODO: handle module dependencies?
  const mcssLookup = new Map<
    `${ResolvedVirtualModuleIdPrefix}${string}`,
    string
  >();
  return {
    name: 'macrostyles',
    transform(code, id, options) {
      // const {transformed,mcss}=babel(code,options,cache)
      // save css to lookup
      // return code
    },
    resolveId(id) {
      if (id.startsWith(virtualModuleIdPrefix)) {
        return `\0${id}`;
      }
      return null;
    },
    load(id) {
      if (!isResolverId(id)) {
        return;
      }
      const found = mcssLookup.get(id);
      return found;
    },
    handleHotUpdate(ctx) {
      // TODO: reset cache based on timestamp
    },
  };
}
