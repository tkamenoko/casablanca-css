import type { ViteDevServer } from "vite";

export function invalidateModules({
  moduleIds,
  server,
}: { server: ViteDevServer; moduleIds: string[] }): void {
  for (const moduleId of moduleIds) {
    const m = server.moduleGraph.getModuleById(moduleId);
    if (m) {
      server.moduleGraph.invalidateModule(m);
      m.lastHMRTimestamp = m.lastInvalidationTimestamp || Date.now();
    }
  }
}
