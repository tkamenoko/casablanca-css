import { build } from "vite";
import { assert } from "vitest";
import { buildModuleId } from "../fixtures/buildModuleId";
import { test } from "../fixtures/extendedTest";

test("should replace embedded component ids to property access in css-tagged styles", async ({
  expect,
  buildInlineConfig,
  transformResult,
}) => {
  const moduleId = buildModuleId({
    relativePath: "./fixtures/styled.tsx",
    root: import.meta.url,
  });
  await build(buildInlineConfig(moduleId));

  assert(transformResult);
  const { stages } = transformResult[moduleId] ?? {};
  const { code } = stages?.[2] ?? {};
  assert(code);
  expect(code).not.toMatch(`import { styled } from '@casablanca/styled';`);
  expect(code).not.toMatch("{TaggedComponent}");
  expect(code).toMatch("{TaggedComponent.__rawClassName}");
  expect(code).not.toMatch(":global(.${TaggedComponent.__rawClassName})");
  expect(code).toMatch(":global(.${StyledDiv.__modularizedClassName})");
});
