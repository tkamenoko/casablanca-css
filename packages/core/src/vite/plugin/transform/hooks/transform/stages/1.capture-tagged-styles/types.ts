export type VariableInfo = {
  originalName: string;
  temporalName: string;
  start: {
    line: number;
    column: number;
  };
  end: {
    line: number;
    column: number;
  };
};

export type CapturedVariableNames = Map<string, VariableInfo>;

export type CapturedGlobalStyleTempNames = string[];

export type GlobalStylePosition = {
  start: { line: number; column: number };
  end: { line: number; column: number };
};

export type ImportSource = {
  names: { className: string; localName: string }[];
  source: string;
};

export type Options = {
  capturedVariableNames: CapturedVariableNames;
  capturedGlobalStylesTempNames: CapturedGlobalStyleTempNames;
  globalStylePositions: GlobalStylePosition[];
  importSources: ImportSource[];
};

export type BabelState = {
  opts: Options;
  shouldTraverse: boolean;
};
