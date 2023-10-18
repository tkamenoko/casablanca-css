import type { NodePath, PluginObj, PluginPass, types } from '@babel/core';
import type babel from '@babel/core';
import { isMacrostylesImport, isTopLevelStatement } from '@macrostyles/utils';

import { isMacrostylesStyledTemplate } from '../helpers/isMacrostylesStyledTemplate';

export function createClassNamesPlugin({
  types: t,
}: typeof babel): PluginObj<PluginPass> {
  return {
    visitor: {
      Program: {
        enter: (path) => {
          const found = path
            .get('body')
            .find((p): p is NodePath<types.ImportDeclaration> =>
              isMacrostylesImport(p, 'react'),
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
                if (!isMacrostylesImport(p, 'react')) {
                  return;
                }
                for (const item of p.get('specifiers')) {
                  if (!item.isImportSpecifier()) {
                    continue;
                  }
                  const imported = item.get('imported');
                  if (imported.isIdentifier()) {
                    const importedName = imported.node.name;
                    if (importedName === 'styled') {
                      item.remove();
                    }
                  }
                }
              },
              exit: (path) => {
                if (!isMacrostylesImport(path, 'react')) {
                  return;
                }
                if (!path.get('specifiers').length) {
                  path.remove();
                }
              },
            },
          });
          const p = path
            .get('body')
            .find((p): p is NodePath<types.ImportDeclaration> =>
              isMacrostylesImport(p, 'core'),
            );
          const css = t.identifier('css');
          if (!p) {
            path.unshiftContainer(
              'body',
              t.importDeclaration(
                [t.importSpecifier(css, css)],
                t.stringLiteral('@macrostyles/core'),
              ),
            );
          } else {
            const hasCssImport = p
              .get('specifiers')
              .find(
                (s) =>
                  s.isImportSpecifier() && s.get('local').node.name === 'css',
              );
            if (!hasCssImport) {
              p.pushContainer('specifiers', t.importSpecifier(css, css));
            }
          }
        },
      },
      VariableDeclaration: {
        enter: (path) => {
          if (!isTopLevelStatement(path)) {
            return;
          }

          for (const declaration of path.get('declarations')) {
            const init = declaration.get('init');
            if (!isMacrostylesStyledTemplate(init)) {
              return;
            }

            const cssTemplate = init.get('quasi');
            const componentId = declaration.get('id');
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
            const cssNode = t.variableDeclaration('const', [
              t.variableDeclarator(
                cssTaggedId,
                t.taggedTemplateExpression(
                  t.identifier('css'),
                  cssTemplate.node,
                ),
              ),
            ]);
            if (path.parentPath.isExportDeclaration()) {
              path.parentPath.insertBefore(cssNode);
            } else {
              path.insertBefore(cssNode);
            }
            // replace component with new function component that has created className
            const tag = init.get('tag');
            if (!tag.isCallExpression()) {
              return;
            }

            const styledComponent = tag.get('arguments').at(0);
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
            const classNameId = t.identifier('className');
            const givenClassNameId =
              path.scope.generateUidIdentifier('givenClassName');
            const newClassNameId =
              path.scope.generateUidIdentifier('newClassName');
            const propsId = path.scope.generateUidIdentifier('props');
            const extractGivenClassName = t.variableDeclaration('const', [
              t.variableDeclarator(
                t.objectPattern([
                  t.objectProperty(classNameId, givenClassNameId),
                ]),
                propsId,
              ),
            ]);
            const newClassNameTemplate = t.templateLiteral(
              [
                t.templateElement({ raw: '' }),
                t.templateElement({ raw: ' ' }),
                t.templateElement({ raw: '' }),
              ],
              [
                t.logicalExpression(
                  '??',
                  givenClassNameId,
                  t.stringLiteral(''),
                ),
                cssTaggedId,
              ],
            );
            const innerJsxElement = t.jsxElement(
              t.jsxOpeningElement(
                jsxId,
                [
                  t.jsxSpreadAttribute(propsId),
                  t.jsxAttribute(
                    t.jsxIdentifier('className'),
                    t.jsxExpressionContainer(newClassNameId),
                  ),
                ],
                true,
              ),
              null,
              [],
            );
            const componentBlockStatement = t.blockStatement([
              extractGivenClassName,
              t.variableDeclaration('const', [
                t.variableDeclarator(newClassNameId, newClassNameTemplate),
              ]),
              t.returnStatement(innerJsxElement),
            ]);
            const replacingFunctionComponent = t.arrowFunctionExpression(
              [propsId],
              componentBlockStatement,
            );
            init.replaceWith(replacingFunctionComponent);
            // assign `__rawClassName` and `__modularizedClassName`
            const assignRawClassName = t.expressionStatement(
              t.assignmentExpression(
                '=',
                t.memberExpression(
                  componentId.node,
                  t.identifier('__rawClassName'),
                ),
                t.stringLiteral(cssTaggedId.name),
              ),
            );
            const assignModularizedClassName = t.expressionStatement(
              t.assignmentExpression(
                '=',
                t.memberExpression(
                  componentId.node,
                  t.identifier('__modularizedClassName'),
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
