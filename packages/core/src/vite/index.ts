import type { Plugin } from 'vite';

import { plugin } from './plugin';
import type { PluginOption } from './types';

export function macrostyles(options?: Partial<PluginOption>): Plugin {
  return plugin(options);
}
