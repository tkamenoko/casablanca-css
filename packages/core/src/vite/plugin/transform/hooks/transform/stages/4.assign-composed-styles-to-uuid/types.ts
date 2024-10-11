export type MapElement = {
  style: string;
  dependsOn: Set<string>;
};

export type OwnedClassNamesToStyles = Map<
  string,
  {
    temporalVariableName: string;
    originalName: string;
    style: string;
  }
>;

export type ResolvedUuidToStyle = Map<
  string,
  {
    uuid: string;
    style: string;
    className: string;
  }
>;
