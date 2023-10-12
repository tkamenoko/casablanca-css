import type { ResolvedModuleId } from '@/types';
import type { CssLookup } from '@/vite/types';

type ReplaceUuidToStylesArgs = {
  ownedClassNamesToStyles: Map<
    string,
    {
      temporalVariableName: string;
      originalName: string;
      style: string;
    }
  >;
  uuidToClassNamesMap: Map<
    string,
    {
      resolvedId: ResolvedModuleId | null;
      className: string;
    }
  >;
  cssLookup: CssLookup;
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
  uuidToClassNamesMap,
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
            throw new Error('Broken composition');
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
          throw new Error('Broken composition');
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
      className: string;
      style: string;
      dependsOn: Set<string>;
    }
  > = new Map();
  uuidToStyles.forEach(({ className, dependsOn, style, uuid }) => {
    let s = style;
    for (const depsUuid of dependsOn) {
      const d =
        resolvedUuidToStyles.get(depsUuid) ?? uuidToStyles.get(depsUuid);
      if (!d) {
        throw new Error('Broken composition');
      }
      s = s.replaceAll(depsUuid, d.style);
      dependsOn.delete(depsUuid);
      d.dependsOn.forEach((dd) => dependsOn.add(dd));
    }
    resolvedUuidToStyles.set(uuid, { className, dependsOn, style: s, uuid });
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
