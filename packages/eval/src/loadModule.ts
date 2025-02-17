import type { Loader, LoaderArgs, LoaderReturn } from "./loaders/types";

export async function loadModule(
  loaders: Loader[],
  args: LoaderArgs,
): Promise<LoaderReturn> {
  const tailLoader = loaders.pop();
  if (!tailLoader) {
    throw new Error("Loaders are empty.");
  }
  const errors: Error[] = [];
  for (const loader of loaders) {
    const result = await loader(args);
    if (result.module) {
      return result;
    }
    errors.push(result.error);
  }
  const result = await tailLoader(args);
  if (result.module) {
    return result;
  }
  errors.push(result.error);
  const errorMsg = `\
Failed to load "${args.specifier}".

Captured errors while loading:
------
${errors.map((e) => `${e}`).join("\n------\n")}
------
`;
  return {
    error: new Error(errorMsg),
    module: null,
  };
}
