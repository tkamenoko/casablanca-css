import type { Plugin } from 'vite';

import type { PluginOption } from '@/types';

import { plugin } from './plugin';

export function macrostyles(options?: Partial<PluginOption>): Plugin {
  return plugin(options);
}
