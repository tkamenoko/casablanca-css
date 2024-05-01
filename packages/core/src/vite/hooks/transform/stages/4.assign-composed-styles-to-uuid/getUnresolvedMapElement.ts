import type { MapElement, OwnedClassNamesToStyles } from "./types";

export function getUnresolvedMapElement({
  ownedClassNamesToStyles,
  className,
  uuids,
}: {
  ownedClassNamesToStyles: OwnedClassNamesToStyles;
  className: string;
  uuids: string[];
}): MapElement {
  const style = ownedClassNamesToStyles.get(className)?.style;
  if (!style) {
    throw new Error(`Broken composition of ${className}`);
  }
  const dependencies = uuids.filter((u) => style?.includes(u));
  return {
    style,
    dependsOn: new Set(dependencies),
  };
}
