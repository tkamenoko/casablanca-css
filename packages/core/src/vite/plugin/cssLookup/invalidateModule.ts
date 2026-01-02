import type { ViteDevServer } from "vite";

export function invalidateModule({
  moduleId,
  server,
}: {
  server: ViteDevServer;
  moduleId: string;
}): void {
  const m = server.moduleGraph.getModuleById(moduleId);
  if (m) {
    server.moduleGraph.invalidateModule(m);
    m.lastHMRTimestamp = m.lastInvalidationTimestamp || Date.now();
  }
}
