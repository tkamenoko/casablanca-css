export const globalStyleIdPrefix = "virtual:casablanca-globals/";
export type GlobalStyleIdPrefix = typeof globalStyleIdPrefix;
export type VirtualGlobalStyleId = `${GlobalStyleIdPrefix}${string}.css`;
