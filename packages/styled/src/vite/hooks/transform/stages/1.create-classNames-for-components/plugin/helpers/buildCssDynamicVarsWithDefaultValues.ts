import { type NodePath, types } from "@babel/core";

type BuilderReturn = {
  functionId: types.Identifier;
  cssVarName: `--${string}`;
  outerFunction: types.VariableDeclaration;
}[];

export function buildCssDynamicVarsWithDefaultValues({
  arrayPaths,
  path,
}: {
  arrayPaths: NodePath<types.ArrayExpression>[];
  path: NodePath<types.VariableDeclaration>;
}): BuilderReturn {
  const cssDynamicVars: BuilderReturn = [];
  for (const arrayPath of arrayPaths) {
    const [arrowFunction, defaultValue, ...unused] = arrayPath.get("elements");
    // ignore invalid cases; it may be `composes` syntax.
    if (!arrowFunction?.isArrowFunctionExpression()) {
      continue;
    }
    if (!defaultValue?.isExpression()) {
      continue;
    }
    if (unused.length) {
      continue;
    }

    const functionId = path.scope.generateUidIdentifier();
    const cssVarName = `--${functionId.name}` as const;
    const outerFunction = types.variableDeclaration("const", [
      types.variableDeclarator(functionId, arrowFunction.node),
    ]);
    // replace embedded functions with `var(--varName, defaultValue)`
    arrayPath.replaceWith(
      types.templateLiteral(
        [
          types.templateElement({ raw: `var(${cssVarName}, ` }),
          types.templateElement({ raw: ")" }),
        ],
        [defaultValue.node],
      ),
    );
    cssDynamicVars.push({ cssVarName, functionId, outerFunction });
  }

  return cssDynamicVars;
}
