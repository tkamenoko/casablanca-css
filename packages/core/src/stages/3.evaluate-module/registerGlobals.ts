import { randomBytes } from 'node:crypto';

const hex = randomBytes(20).toString('hex');

export const registerGlobals = `
import { GlobalRegistrator as GlobalRegistrator_${hex} } from '@happy-dom/global-registrator';
if(!globalThis.window){
  GlobalRegistrator_${hex}.register();
  globalThis.window = globalThis;
}
`;

export const unregisterGlobals = `
GlobalRegistrator_${hex}.unregister()
globalThis.window = undefined;
`;
