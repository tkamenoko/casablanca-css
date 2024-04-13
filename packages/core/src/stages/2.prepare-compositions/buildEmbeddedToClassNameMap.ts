import { randomUUID } from "node:crypto";
import type { ImportSource } from "../1.capture-tagged-styles/types";
import { buildResolvedIdFromJsId } from "./plugin/helpers/buildResolvedIdFromJsId";
import type { EmbeddedToClassNameMap } from "./types";

export async function buildEmbeddedToClassNameMap({
  importSources,
  resolve,
  projectRoot,
}: {
  importSources: ImportSource[];
  resolve: (id: string) => Promise<string | null | undefined>;
  projectRoot: string;
}): Promise<EmbeddedToClassNameMap> {
  const result: EmbeddedToClassNameMap = new Map();

  await Promise.all(
    importSources.map(async ({ names, source }) => {
      const resolvedId = await resolve(source);
      if (!resolvedId) {
        return;
      }
      const cssId = buildResolvedIdFromJsId({ jsId: resolvedId, projectRoot });
      for (const { className, localName } of names) {
        result.set(localName, {
          className,
          cssId,
          uuid: randomUUID(),
        });
      }
    }),
  );

  return result;
}
