import { types } from "@babel/core";

export function buildPropsCleaningStatement({
  originalPropsId,
  cleanedPropsId,
  excludingParamsSetId,
}: {
  originalPropsId: types.Identifier;
  cleanedPropsId: types.Identifier;
  excludingParamsSetId: types.Identifier;
}): types.VariableDeclaration {
  // const cleanedProps=Object.entries(props).filter(([k]) => !ss.has(k))

  const objectId = types.identifier("Object");

  const propsEntries = types.callExpression(
    types.memberExpression(objectId, types.identifier("entries")),
    [originalPropsId],
  );

  const filteringObjectKey = types.identifier("k");
  const setHasKey = types.callExpression(
    types.memberExpression(excludingParamsSetId, types.identifier("has")),
    [filteringObjectKey],
  );
  const filteringCondition = types.unaryExpression("!", setHasKey);
  const filteringFunction = types.arrowFunctionExpression(
    [types.arrayPattern([filteringObjectKey])],
    filteringCondition,
  );
  const filteredProps = types.callExpression(
    types.memberExpression(propsEntries, types.identifier("filter")),
    [filteringFunction],
  );

  const cleanedProps = types.variableDeclaration("const", [
    types.variableDeclarator(
      cleanedPropsId,
      types.callExpression(
        types.memberExpression(objectId, types.identifier("fromEntries")),
        [filteredProps],
      ),
    ),
  ]);
  return cleanedProps;
}
