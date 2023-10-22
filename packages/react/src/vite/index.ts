import type { Plugin } from 'vite';

import type { PluginOption } from './plugin';
import { plugin } from './plugin';

export function macrostylesReact(options?: Partial<PluginOption>): Plugin {
  return plugin(options);
}
