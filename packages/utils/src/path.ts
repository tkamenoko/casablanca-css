export function extractPathAndParamsFromId(id: string): {
  path: string;
  queries: URLSearchParams;
} {
  const [path, ...q] = id.split("?");
  if (!path) {
    throw new Error("Invalid ID form.");
  }
  return { path, queries: new URLSearchParams(q.join("?")) };
}
