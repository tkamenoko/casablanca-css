import type { CssModulesLookup } from '@/vite/types';

import type { UuidToStylesMap } from '../2.prepare-compositions/types';

type ReplaceUuidToStylesArgs = {
  ownedClassNamesToStyles: Map<
    string,
    {
      temporalVariableName: string;
      originalName: string;
      style: string;
    }
  >;
  uuidToStylesMap: UuidToStylesMap;
  cssLookup: CssModulesLookup;
};
export type ReplaceUuidToStylesReturn = {
  composedStyles: {
    temporalVariableName: string;
    originalName: string;
    style: string;
  }[];
};

export function replaceUuidToStyles({
  cssLookup,
  ownedClassNamesToStyles,
  uuidToStylesMap: uuidToClassNamesMap,
}: ReplaceUuidToStylesArgs): ReplaceUuidToStylesReturn {
  const uuids = Array.from(uuidToClassNamesMap.keys());
  const uuidToStyles = new Map(
    Array.from(uuidToClassNamesMap.entries())
      .map(([uuid, { className, resolvedId }]) => {
        if (resolvedId) {
          const style = cssLookup
            .get(resolvedId)
            ?.classNameToStyleMap.get(className)?.style;
          if (!style) {
            throw new Error(`Broken composition of ${className}`);
          }
          return [
            uuid,
            {
              uuid,
              className,
              style,
              dependsOn: new Set<string>(),
            },
          ] as const;
        }
        const style = ownedClassNamesToStyles.get(className)?.style;
        if (!style) {
          throw new Error(`Broken composition of ${className}`);
        }
        const dependencies = uuids.filter((u) => style?.includes(u));
        return [
          uuid,
          {
            uuid,
            className,
            style,
            dependsOn: new Set(dependencies),
          },
        ] as const;
      })
      .sort(([, a], [, b]) => a.dependsOn.size - b.dependsOn.size),
  );
  const resolvedUuidToStyles: Map<
    string,
    {
      uuid: string;
      style: string;
      dependsOn: Set<string>;
    }
  > = new Map();
  uuidToStyles.forEach(({ dependsOn, style, uuid, className }) => {
    let s = style;
    for (const depsUuid of dependsOn) {
      const d =
        resolvedUuidToStyles.get(depsUuid) ?? uuidToStyles.get(depsUuid);
      if (!d) {
        throw new Error(`Broken composition of ${className}`);
      }
      s = s.replaceAll(depsUuid, d.style);
      dependsOn.delete(depsUuid);
      d.dependsOn.forEach((dd) => dependsOn.add(dd));
    }
    resolvedUuidToStyles.set(uuid, { dependsOn, style: s, uuid });
  });
  const result = Array.from(ownedClassNamesToStyles.values()).map(
    ({ style, originalName, temporalVariableName }) => {
      let s = style;
      for (const { style, uuid } of resolvedUuidToStyles.values()) {
        s = s.replaceAll(uuid, style);
      }
      return { style: s, temporalVariableName, originalName };
    },
  );
  return { composedStyles: result };
}
