import { resolve } from 'node:path';

import { normalizePath } from 'vite';

export function buildModuleId({
  relativePath,
  root,
}: {
  relativePath: `./${string}`;
  root: string;
}): string {
  return normalizePath(
    resolve(
      root
        .replace(/^file:\/\//, '')
        .split('/')
        .slice(0, -1)
        .join('/'),
      relativePath
    )
  );
}
