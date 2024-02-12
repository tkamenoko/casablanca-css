import { type NodePath, types } from "@babel/core";

type BuilderReturn = {
  functionId: types.Identifier;
  cssVarName: `--${string}`;
  outerFunction: types.VariableDeclaration;
}[];

export function buildCssDynamicVarsFromEmbeddedFunctions({
  arrowFunctionPaths,
  path,
}: {
  arrowFunctionPaths: NodePath<types.ArrowFunctionExpression>[];
  path: NodePath<types.VariableDeclaration>;
}): BuilderReturn {
  const cssDynamicVars: BuilderReturn = [];
  for (const arrowFunction of arrowFunctionPaths) {
    const functionId = path.scope.generateUidIdentifier();
    const cssVarName = `--${functionId.name}` as const;
    const outerFunction = types.variableDeclaration("const", [
      types.variableDeclarator(functionId, arrowFunction.node),
    ]);
    // replace embedded functions with `var(--varName)`
    arrowFunction.replaceWith(types.stringLiteral(`var(${cssVarName})`));
    cssDynamicVars.push({ cssVarName, functionId, outerFunction });
  }
  return cssDynamicVars;
}
