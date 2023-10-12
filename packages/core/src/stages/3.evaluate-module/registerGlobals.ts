import { randomBytes } from 'node:crypto';

const hex = randomBytes(20).toString('hex');

export const registerGlobals = `
import { GlobalRegistrator as GlobalRegistrator_${hex} } from '@happy-dom/global-registrator';

let shouldUnregister_${hex} = false;
if(!globalThis.window){
  try {
    GlobalRegistrator_${hex}.register();
    shouldUnregister_${hex} = true;
  } catch (e) {
    console.log("already registered");
  }
  finally{
    globalThis.window = globalThis;
  }
}
`;

export const unregisterGlobals = `
if(shouldUnregister_${hex}){
  GlobalRegistrator_${hex}.unregister()
  globalThis.window = undefined;
  shouldUnregister_${hex} = false;
}
`;
