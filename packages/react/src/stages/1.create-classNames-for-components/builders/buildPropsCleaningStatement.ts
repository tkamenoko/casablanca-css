import { types } from "@babel/core";

export function buildPropsCleaningStatement({
  originalPropsId,
  cleanedPropsId,
  excludingParamNames,
}: {
  originalPropsId: types.Identifier;
  cleanedPropsId: types.Identifier;
  excludingParamNames: { name: string; tempId: types.Identifier }[];
}): types.VariableDeclaration {
  // const {excluded1:_, excluded2:__,...cleanedProps}=props;
  const excludingProperties = excludingParamNames.map(({ name, tempId }) =>
    types.objectProperty(types.identifier(name), tempId),
  );

  const cleanedProps = types.variableDeclaration("const", [
    types.variableDeclarator(
      types.objectPattern([
        ...excludingProperties,
        types.restElement(cleanedPropsId),
      ]),
      originalPropsId,
    ),
  ]);
  return cleanedProps;
}
