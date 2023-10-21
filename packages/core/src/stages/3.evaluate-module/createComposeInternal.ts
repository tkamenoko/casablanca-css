import type { TaggedStyle } from '@macrostyles/utils/index';

import type { ResolvedModuleId } from '@/vite/types';

import type { UuidToStylesMap } from '../2.prepare-compositions/types';

export type ComposeInternalArg = {
  uuid: string;
  varName: string;
  value: TaggedStyle<unknown>;
  resolvedId: ResolvedModuleId | null;
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
      continue;
    }
    return uuids.join('\n');
  };
}
