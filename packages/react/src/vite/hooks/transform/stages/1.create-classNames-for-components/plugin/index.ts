import type { NodePath, PluginObj, PluginPass, types } from "@babel/core";
import type babel from "@babel/core";
import { isCasablancaImport, isTopLevelStatement } from "@casablanca/utils";
import { buildClassNameExtractingStatement } from "./helpers/buildClassNameExtractingStatement";
import { buildCssDynamicVarsFromEmbeddedFunctions } from "./helpers/buildCssDynamicVarsFromEmbeddedFunctions";
import { buildInlineStylesAssignmentStatement } from "./helpers/buildInlineStylesAssignmentStatement";
import { buildInnerJsxElement } from "./helpers/buildInnerJsxElement";
import { buildNewClassNameAssignmentStatement } from "./helpers/buildNewClassNameAssignmentStatement";
import { buildPropsCleaningStatement } from "./helpers/buildPropsCleaningStatement";
import { extractPathsFromDeclaration } from "./helpers/extractPathsFromDeclaration";
import { getAnnotatedParams } from "./helpers/getAnnotatedParams";
import { getImportedNameFromImportSpecifier } from "./helpers/getImportedNameFromImportSpecifier";
import { insertNodeOnTopLevel } from "./helpers/insertNodesOnTopLevel";

export function plugin({
  types: t,
}: typeof babel): PluginObj<PluginPass & { shouldTraverse: boolean }> {
  return {
    visitor: {
      Program: {
        enter: (path, state) => {
          const found = path
            .get("body")
            .find((p): p is NodePath<types.ImportDeclaration> =>
              isCasablancaImport(p, "react"),
            );
          state.shouldTraverse = Boolean(found);
        },
        exit: (path, state) => {
          if (!state.shouldTraverse) {
            return;
          }
          path.traverse({
            ImportDeclaration: {
              enter: (p) => {
                if (!isCasablancaImport(p, "react")) {
                  return;
                }
                for (const item of p.get("specifiers")) {
                  const importedName = getImportedNameFromImportSpecifier(item);
                  if (importedName === "styled") {
                    item.remove();
                  }
                }
              },
              exit: (path) => {
                if (!isCasablancaImport(path, "react")) {
                  return;
                }
                if (!path.get("specifiers").length) {
                  path.remove();
                }
              },
            },
          });
          const p = path
            .get("body")
            .find((p): p is NodePath<types.ImportDeclaration> =>
              isCasablancaImport(p, "core"),
            );
          const css = t.identifier("css");
          if (!p) {
            path.unshiftContainer(
              "body",
              t.importDeclaration(
                [t.importSpecifier(css, css)],
                t.stringLiteral("@casablanca/core"),
              ),
            );
          } else {
            const hasCssImport = p
              .get("specifiers")
              .find(
                (s) =>
                  s.isImportSpecifier() && s.get("local").node.name === "css",
              );
            if (!hasCssImport) {
              p.pushContainer("specifiers", t.importSpecifier(css, css));
            }
          }
        },
      },
      VariableDeclarator: {
        enter: (path, state) => {
          if (!state.shouldTraverse) {
            return;
          }
          const declaration = path.parentPath;
          if (
            !(
              declaration.isVariableDeclaration() &&
              isTopLevelStatement(declaration)
            )
          ) {
            return;
          }

          // validate `styled` usage
          const validatedDeclaration = extractPathsFromDeclaration(path);
          if (!validatedDeclaration) {
            return;
          }
          const { componentId, componentName, init, styledComponent } =
            validatedDeclaration;

          const cssTaggedId = path.scope.generateUidIdentifier(
            `styled${componentName}`,
          );
          // create `css` tagged style
          const cssTemplate = init.get("quasi");
          const cssNode = t.variableDeclaration("const", [
            t.variableDeclarator(
              cssTaggedId,
              t.taggedTemplateExpression(t.identifier("css"), cssTemplate.node),
            ),
          ]);
          insertNodeOnTopLevel(declaration, cssNode, "before");
          // extract functions from template for dynamic styling
          const arrowFunctionPaths = cssTemplate
            .get("expressions")
            .filter((e): e is NodePath<types.ArrowFunctionExpression> =>
              e.isArrowFunctionExpression(),
            );
          const cssDynamicVars = buildCssDynamicVarsFromEmbeddedFunctions({
            arrowFunctionPaths,
            path: declaration,
          });
          // move function to the top level
          const outerFunctions = cssDynamicVars.map((c) => c.outerFunction);
          insertNodeOnTopLevel(declaration, outerFunctions, "before");
          // replace component with new function component that has created className
          const jsxName = styledComponent.isIdentifier()
            ? styledComponent.node.name
            : styledComponent.node.value;
          const jsxId = t.jsxIdentifier(jsxName);

          const givenClassNameId =
            path.scope.generateUidIdentifier("givenClassName");
          const newClassNameId =
            path.scope.generateUidIdentifier("newClassName");
          const propsId = path.scope.generateUidIdentifier("props");
          const extractGivenClassName = buildClassNameExtractingStatement({
            givenClassNameId,
            propsId,
          });

          const assignNewClassName = buildNewClassNameAssignmentStatement({
            additionalClassNameId: givenClassNameId,
            cssTaggedId,
            newClassNameId,
          });

          const inlineStyleId = path.scope.generateUidIdentifier("inlineStyle");
          const assignInlineStyles = buildInlineStylesAssignmentStatement({
            cssDynamicVars,
            inlineStyleId,
            propsId,
          });

          const cleanedPropsId = path.scope.generateUidIdentifier("props");
          const annotatedParams = getAnnotatedParams(init).map((s) => ({
            name: s,
            tempId: path.scope.generateUidIdentifier(),
          }));

          const cleanProps = buildPropsCleaningStatement({
            cleanedPropsId,
            originalPropsId: propsId,
            excludingParamNames: annotatedParams,
          });

          const innerJsxElement = buildInnerJsxElement({
            classNameId: newClassNameId,
            inlineStyleId,
            jsxId,
            propsId: cleanProps ? cleanedPropsId : propsId,
          });
          const returnJsxElement = t.returnStatement(innerJsxElement);

          const blockStatements = [
            extractGivenClassName,
            assignNewClassName,
            assignInlineStyles,
            cleanProps,
            returnJsxElement,
          ].filter((x): x is NonNullable<typeof x> => !!x);
          const componentBlockStatement = t.blockStatement(blockStatements);
          const replacingFunctionComponent = t.arrowFunctionExpression(
            [propsId],
            componentBlockStatement,
          );
          init.replaceWith(replacingFunctionComponent);
          // assign `__rawClassName` and `__modularizedClassName`
          const assignRawClassName = t.expressionStatement(
            t.assignmentExpression(
              "=",
              t.memberExpression(
                componentId.node,
                t.identifier("__rawClassName"),
              ),
              t.stringLiteral(cssTaggedId.name),
            ),
          );
          const assignModularizedClassName = t.expressionStatement(
            t.assignmentExpression(
              "=",
              t.memberExpression(
                componentId.node,
                t.identifier("__modularizedClassName"),
              ),
              cssTaggedId,
            ),
          );
          insertNodeOnTopLevel(
            declaration,
            [assignRawClassName, assignModularizedClassName],
            "after",
          );
        },
      },
    },
  };
}
