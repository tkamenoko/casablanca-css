export const cssModuleIdPrefix = "virtual:casablanca-modules/";
export type CssModuleIdPrefix = typeof cssModuleIdPrefix;
export type VirtualCssModuleId = `${CssModuleIdPrefix}${string}.module.css`;
