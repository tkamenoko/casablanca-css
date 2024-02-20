import type { NodePath, PluginObj, PluginPass, types } from "@babel/core";
import type babel from "@babel/core";
import { isCasablancaImport, isTopLevelStatement } from "@casablanca/utils";
import { isCasablancaStyledTemplate } from "../helpers/isCasablancaStyledTemplate";
import { buildClassNameExtractingStatement } from "./builders/buildClassNameExtractingStatement";
import { buildCssDynamicVarsFromEmbeddedFunctions } from "./builders/buildCssDynamicVarsFromEmbeddedFunctions";
import { buildExcludingParamsSetStatement } from "./builders/buildExcludingParamsSetStatement";
import { buildInlineStylesAssignmentStatement } from "./builders/buildInlineStylesAssignmentStatement";
import { buildInnerJsxElement } from "./builders/buildInnerJsxElement";
import { buildNewClassNameAssignmentStatement } from "./builders/buildNewClassNameAssignmentStatement";
import { buildPropsCleaningStatement } from "./builders/buildPropsCleaningStatement";
import { getAnnotatedParams } from "./getAnnotatedParams";

export function createClassNamesPlugin({
  types: t,
}: typeof babel): PluginObj<PluginPass> {
  return {
    visitor: {
      Program: {
        enter: (path) => {
          const found = path
            .get("body")
            .find((p): p is NodePath<types.ImportDeclaration> =>
              isCasablancaImport(p, "react"),
            );
          if (!found) {
            path.stop();
            return;
          }
        },
        exit: (path) => {
          path.traverse({
            ImportDeclaration: {
              enter: (p) => {
                if (!isCasablancaImport(p, "react")) {
                  return;
                }
                for (const item of p.get("specifiers")) {
                  if (!item.isImportSpecifier()) {
                    continue;
                  }
                  const imported = item.get("imported");
                  if (imported.isIdentifier()) {
                    const importedName = imported.node.name;
                    if (importedName === "styled") {
                      item.remove();
                    }
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
      VariableDeclaration: {
        enter: (path) => {
          if (!isTopLevelStatement(path)) {
            return;
          }

          for (const declaration of path.get("declarations")) {
            const init = declaration.get("init");
            if (!isCasablancaStyledTemplate(init)) {
              return;
            }

            const cssTemplate = init.get("quasi");
            const componentId = declaration.get("id");
            if (!componentId.isIdentifier()) {
              return;
            }

            const componentName = componentId.node.name;
            if (!componentName.at(0)?.match(/[A-Z]/)) {
              throw new Error(
                `Component name "${{
                  componentName,
                }}" must starts with upper case.`,
              );
            }
            const cssTaggedId = path.scope.generateUidIdentifier(
              `styled${componentName}`,
            );
            // create `css` tagged style
            const cssNode = t.variableDeclaration("const", [
              t.variableDeclarator(
                cssTaggedId,
                t.taggedTemplateExpression(
                  t.identifier("css"),
                  cssTemplate.node,
                ),
              ),
            ]);
            if (path.parentPath.isExportDeclaration()) {
              path.parentPath.insertBefore(cssNode);
            } else {
              path.insertBefore(cssNode);
            }
            // extract functions from template for dynamic styling
            const arrowFunctionPaths = cssTemplate
              .get("expressions")
              .filter((e): e is NodePath<types.ArrowFunctionExpression> =>
                e.isArrowFunctionExpression(),
              );
            const cssDynamicVars = buildCssDynamicVarsFromEmbeddedFunctions({
              arrowFunctionPaths,
              path,
            });
            // move function to the top level
            const outerFunctions = cssDynamicVars.map((c) => c.outerFunction);
            if (path.parentPath.isExportDeclaration()) {
              path.parentPath.insertBefore(outerFunctions);
            } else {
              path.insertBefore(outerFunctions);
            }

            // replace component with new function component that has created className
            const tag = init.get("tag");
            if (!tag.isCallExpression()) {
              return;
            }

            const styledComponent = tag.get("arguments").at(0);
            if (
              !(
                styledComponent?.isIdentifier() ||
                styledComponent?.isStringLiteral()
              )
            ) {
              throw new Error(`Invalid "styled" usage for ${componentName}`);
            }
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

            const inlineStyleId =
              path.scope.generateUidIdentifier("inlineStyle");
            const assignInlineStyles = buildInlineStylesAssignmentStatement({
              cssDynamicVars,
              inlineStyleId,
              propsId,
            });

            const cleanedPropsId = path.scope.generateUidIdentifier("props");
            const annotatedParams = getAnnotatedParams(init).map((s) =>
              t.stringLiteral(s),
            );
            const excludingParamsSetId = path.scope.generateUidIdentifier();
            const initExcludingParamsSet = annotatedParams.length
              ? buildExcludingParamsSetStatement({
                  annotatedParams,
                  paramsSetId: excludingParamsSetId,
                })
              : null;
            if (initExcludingParamsSet) {
              if (path.parentPath.isExportDeclaration()) {
                path.parentPath.insertBefore(initExcludingParamsSet);
              } else {
                path.insertBefore(initExcludingParamsSet);
              }
            }

            const cleanProps = initExcludingParamsSet
              ? buildPropsCleaningStatement({
                  cleanedPropsId,
                  excludingParamsSetId,
                  originalPropsId: propsId,
                })
              : null;

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
            if (path.parentPath.isExportDeclaration()) {
              path.parentPath.insertAfter([
                assignRawClassName,
                assignModularizedClassName,
              ]);
            } else {
              path.insertAfter([
                assignRawClassName,
                assignModularizedClassName,
              ]);
            }
          }
        },
      },
    },
  };
}
