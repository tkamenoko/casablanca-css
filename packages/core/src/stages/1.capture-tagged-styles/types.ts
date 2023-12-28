export type CapturedVariableNames = Map<
  string,
  { originalName: string; temporalName: string }
>;

export type CapturedGlobalStyleTempNames = string[];

export type ImportSource = {
  names: { className: string; localName: string }[];
  source: string;
};

export type Options = {
  capturedVariableNames: CapturedVariableNames;
  capturedGlobalStylesTempNames: CapturedGlobalStyleTempNames;
  importSources: ImportSource[];
};

export type BabelState = {
  opts: Options;
};
