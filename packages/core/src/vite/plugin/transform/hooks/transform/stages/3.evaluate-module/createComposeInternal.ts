import type { TaggedStyle } from "@casablanca-css/utils";
import type { ResolvedCssModuleId } from "#@/vite/types/resolvedCssModuleId";
import type { UuidToStylesMap } from "../2.prepare-compositions/types";

export type ComposeInternalArg = {
  uuid: string;
  varName: string;
  value: TaggedStyle<unknown>;
  resolvedId: ResolvedCssModuleId | null;
};

type ComposeInternal = (...args: ComposeInternalArg[]) => string;

export function createComposeInternal(
  uuidToStylesMap: UuidToStylesMap,
): ComposeInternal {
  return (...args) => {
    const uuids: string[] = [];
    for (const { resolvedId, uuid, value, varName } of args) {
      const stored = uuidToStylesMap.get(uuid);
      if (!stored) {
        throw new Error(`Invalid composed value: ${varName}`);
      }
      const componentClassName = value.__rawClassName;
      uuidToStylesMap.set(uuid, {
        resolvedId,
        varName,
        className: componentClassName ?? stored.className,
      });
      uuids.push(uuid);
    }
    return uuids.join("\n");
  };
}
