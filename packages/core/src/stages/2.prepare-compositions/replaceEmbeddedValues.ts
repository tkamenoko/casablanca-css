import { randomUUID } from "node:crypto";
import type babel from "@babel/core";
import type { NodePath, PluginObj, PluginPass, types } from "@babel/core";
import { isTopLevelStatement } from "@casablanca/utils";
import type { ResolvedCssModuleId } from "#@/vite/types";
import type { ComposeInternalArg } from "../3.evaluate-module/createComposeInternal";
import { markImportedSelectorsAsGlobal } from "./markImportedSelectorsAsGlobal";
import type { UuidToStylesMap } from "./types";

export type Options = {
  temporalVariableNames: string[];
  embeddedToClassNameMap: Map<
    string,
    { className: string; cssId: ResolvedCssModuleId; uuid: string }
  >;
  uuidToStylesMap: UuidToStylesMap;
};

type BabelState = {
  opts: Options;
};

export function replaceEmbeddedValuesPlugin({
  types: t,
}: typeof babel): PluginObj<PluginPass & BabelState> {
  return {
    visitor: {
      VariableDeclaration: {
        enter: (path, state) => {
          // find target templates.
          if (!isTopLevelStatement(path)) {
            return;
          }
          for (const declaration of path.get("declarations")) {
            const id = declaration.get("id");
            if (
              !id.isIdentifier() ||
              !state.opts.temporalVariableNames.includes(id.node.name)
            ) {
              continue;
            }
            const init = declaration.get("init");
            if (!init.isTemplateLiteral()) {
              continue;
            }
            // raw classNames are replaced with unique classNames even if it is already modified.
            // imported classNames are already evaluated. This avoids duplication of replacing classNames.
            markImportedSelectorsAsGlobal({ templateLiteralPath: init });
            // fix `composes: ...` property
            const expressions = init.get("expressions");
            const quasis = init.get("quasis");
            for (const [i, quasi] of quasis.entries()) {
              const expression = expressions.at(i);
              if (!expression) {
                continue;
              }
              const ids = expression.isArrayExpression()
                ? expression
                    .get("elements")
                    .filter((e): e is NodePath<types.Identifier> =>
                      e.isIdentifier(),
                    )
                : expression.isIdentifier()
                  ? [expression]
                  : [];
              if (!ids.length) {
                continue;
              }
              const style = quasi.node.value.raw;
              if (!style.match(/(?:;|\s)composes:\s*$/)) {
                continue;
              }
              const composeArgs: (Omit<ComposeInternalArg, "value"> & {
                valueId: types.Identifier;
              })[] = [];
              for (const id of ids) {
                const name = id.node.name;
                const {
                  className,
                  cssId,
                  uuid = randomUUID(),
                } = state.opts.embeddedToClassNameMap.get(name) ?? {};
                const resolvedId = cssId ?? null;
                const varName = name;
                state.opts.uuidToStylesMap.set(uuid, {
                  varName,
                  className: className ?? name,
                  resolvedId,
                });
                composeArgs.push({
                  resolvedId,
                  uuid,
                  varName,
                  valueId: id.node,
                });
              }
              expression.replaceWith(
                t.callExpression(
                  t.identifier("__composeInternal"),
                  composeArgs.map(({ resolvedId, uuid, valueId, varName }) => {
                    const resolvedIdProperty = t.objectProperty(
                      t.identifier("resolvedId"),
                      resolvedId
                        ? t.stringLiteral(resolvedId)
                        : t.nullLiteral(),
                    );
                    const uuidProperty = t.objectProperty(
                      t.identifier("uuid"),
                      t.stringLiteral(uuid),
                    );
                    const valueProperty = t.objectProperty(
                      t.identifier("value"),
                      valueId,
                    );
                    const varNameProperty = t.objectProperty(
                      t.identifier("varName"),
                      t.stringLiteral(varName),
                    );
                    return t.objectExpression([
                      resolvedIdProperty,
                      uuidProperty,
                      valueProperty,
                      varNameProperty,
                    ]);
                  }),
                ),
              );
              const removedCompose = style.replace(
                /(?<prev>;|\s)composes:\s*$/,
                "$<prev>",
              );
              quasi.replaceWith(t.templateElement({ raw: removedCompose }));
            }
          }
        },
      },
    },
  };
}
