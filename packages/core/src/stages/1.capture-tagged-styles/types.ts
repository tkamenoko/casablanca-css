export type CapturedVariableNames = Map<
  string,
  { originalName: string; temporalName: string; tagType: 'css' }
>;

export type ImportSource = {
  names: { className: string; localName: string }[];
  source: string;
};

export type Options = {
  capturedVariableNames: CapturedVariableNames;
  importSources: ImportSource[];
};

export type BabelState = {
  opts: Options;
};
