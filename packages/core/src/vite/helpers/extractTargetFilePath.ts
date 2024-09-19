import { extractPathAndParamsFromId } from "@casablanca-css/utils";

export function extractTargetFilePath({
  extensions,
  id,
  include,
}: { id: string; include: Set<string>; extensions: `.${string}`[] }):
  | string
  | null {
  const { path, queries } = extractPathAndParamsFromId(id);
  if (queries.has("raw")) {
    return null;
  }
  if (!(include.has(path) || extensions.some((e) => path.endsWith(e)))) {
    // ignore module that is not JS/TS code
    return null;
  }
  if (/\/node_modules\//.test(path)) {
    // ignore third party packages
    return null;
  }
  return path;
}
