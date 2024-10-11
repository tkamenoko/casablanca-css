import type { CssLookupApi } from "#@/vite/plugin/cssLookup";
import type { UuidToStylesMap } from "../2.prepare-compositions/types";
import { getResolvedMapElement } from "./getResolvedMapElement";
import { getUnresolvedMapElement } from "./getUnresolvedMapElement";
import { resolveEmbeddedUuids } from "./resolveEmbeddedUuids";
import type { OwnedClassNamesToStyles } from "./types";

type ReplaceUuidToStylesArgs = {
  ownedClassNamesToStyles: OwnedClassNamesToStyles;
  uuidToStylesMap: UuidToStylesMap;
  cssModulesLookupApi: CssLookupApi["cssModule"];
};
export type ReplaceUuidToStylesReturn = {
  composedStyles: {
    temporalVariableName: string;
    originalName: string;
    style: string;
  }[];
};

export function replaceUuidWithStyles({
  cssModulesLookupApi,
  ownedClassNamesToStyles,
  uuidToStylesMap: uuidToClassNamesMap,
}: ReplaceUuidToStylesArgs): ReplaceUuidToStylesReturn {
  const uuids = Array.from(uuidToClassNamesMap.keys());
  const uuidToStyle = new Map(
    Array.from(uuidToClassNamesMap.entries()).map(
      ([uuid, { className, resolvedId }]) => {
        const e = resolvedId
          ? getResolvedMapElement({
              className,
              cssModulesLookupApi,
              resolvedId,
            })
          : getUnresolvedMapElement({
              className,
              ownedClassNamesToStyles,
              uuids,
            });
        return [
          uuid,
          {
            uuid,
            className,
            ...e,
          },
        ] as const;
      },
    ),
  );
  const resolvedUuidToStyle = resolveEmbeddedUuids({ uuidToStyle });

  const result = Array.from(ownedClassNamesToStyles.values()).map(
    ({ style, originalName, temporalVariableName }) => {
      let s = style;
      for (const { style, uuid } of resolvedUuidToStyle.values()) {
        s = s.replaceAll(uuid, style);
      }
      return { style: s, temporalVariableName, originalName };
    },
  );

  return { composedStyles: result };
}
