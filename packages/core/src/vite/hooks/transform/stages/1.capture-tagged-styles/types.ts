export type CapturedVariableNames = Map<
  string,
  {
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
  }
>;

export type CapturedGlobalStyleTempNames = string[];

export type GlobalStylePositions = {
  start: { line: number; column: number };
  end: { line: number; column: number };
}[];

export type ImportSource = {
  names: { className: string; localName: string }[];
  source: string;
};

export type Options = {
  capturedVariableNames: CapturedVariableNames;
  capturedGlobalStylesTempNames: CapturedGlobalStyleTempNames;
  globalStylePositions: GlobalStylePositions;
  importSources: ImportSource[];
};

export type BabelState = {
  opts: Options;
  shouldTraverse: boolean;
};
