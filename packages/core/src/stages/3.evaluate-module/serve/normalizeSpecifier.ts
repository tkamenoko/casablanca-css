export function normalizeSpecifier(specifier: string): string {
  const fixVirtualPrefix = specifier.startsWith("/@id/__x00__")
    ? specifier.replace("/@id/__x00__", "\0")
    : specifier;
  const removeIdPrefix = fixVirtualPrefix.startsWith("/@id/")
    ? fixVirtualPrefix.replace("/@id/", "")
    : fixVirtualPrefix;
  return removeIdPrefix;
}
