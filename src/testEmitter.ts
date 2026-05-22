/**
 * Render a `TestSpecIR` as a Playwright TypeScript spec file.
 *
 * Output shape:
 *
 *   import { test, expect } from "@playwright/test";
 *   import { LoginPage } from "../pages/login.page";
 *
 *   test.describe("User Login", () => {
 *     test.beforeEach(async ({ page }) => {
 *       const loginPage = new LoginPage(page);
 *       await loginPage.goto();
 *     });
 *
 *     test("Successful login", async ({ page }) => {
 *       const loginPage = new LoginPage(page);
 *       await loginPage.login("alice@example.com", "secret");
 *       await expect(loginPage.dashboardHeading).toBeVisible();
 *     });
 *   });
 *
 * As with `emitPageObject`, method bodies arrive pre-rendered.
 */

import type { EmitResult, HookIR, ReviewItem, TestSpecIR } from "./types";
import { dedentAndIndent } from "./indent";

export function emitTestSpec(ir: TestSpecIR): EmitResult {
  const warnings: ReviewItem[] = [];
  const lines: string[] = [];

  // Imports — playwrightImports (v1.1.0) merges extra named imports into
  // the @playwright/test line. E.g. `["type APIResponse"]` produces
  // `import { test, expect, type APIResponse } from "@playwright/test";`.
  const playwrightNames = ["test", "expect", ...(ir.playwrightImports ?? [])];
  lines.push(
    `import { ${playwrightNames.join(", ")} } from "@playwright/test";`,
  );
  if (ir.pomImports && ir.pomImports.length) {
    for (const imp of ir.pomImports) {
      lines.push(`import { ${imp.className} } from "${imp.fromPath}";`);
    }
  }
  if (ir.extraImports && ir.extraImports.length) {
    for (const imp of ir.extraImports) lines.push(imp);
  }
  lines.push("");

  lines.push(`test.describe(${JSON.stringify(ir.describeName)}, () => {`);

  // describeBodyPrelude (v1.1.0) — describe-scoped state declarations
  // (e.g. `let apiResponse: APIResponse | null = null;`) emitted before
  // any hooks. Indented one level deeper than the describe call.
  if (ir.describeBodyPrelude && ir.describeBodyPrelude.trim().length > 0) {
    for (const line of ir.describeBodyPrelude.split("\n")) {
      lines.push(line.length ? `  ${line}` : "");
    }
  }

  // Hooks
  emitHooks(lines, "test.beforeAll", ir.beforeAll);
  emitHooks(lines, "test.beforeEach", ir.beforeEach);

  // Tests
  for (const t of ir.tests) {
    lines.push("");
    if (t.tags && t.tags.length) {
      // v1.1.0 — tag names sometimes arrive with `@` already attached
      // (Gherkin parser convention: tag.name returns "@api", not "api").
      // Strip a single leading `@` to avoid double-`@@` in the emitted
      // comment.
      for (const tag of t.tags) {
        const clean = tag.startsWith("@") ? tag.slice(1) : tag;
        lines.push(`  // @${clean}`);
      }
    }
    if (t.jsdoc) {
      for (const docLine of t.jsdoc.split("\n")) {
        lines.push("  " + docLine);
      }
    }
    const fixtures = (t.fixtures && t.fixtures.length ? t.fixtures : ["page"]).join(
      ", ",
    );
    // v1.2.0 — every test signature receives `testInfo` as the second
    // argument. TypeScript is fine with unused destructured params, and
    // downstream tooling (visual-regression hooks, custom reporters,
    // artefact uploads) now has access to testInfo.titlePath /
    // testInfo.attach() / testInfo.testId without post-processing.
    if (t.fixme) {
      lines.push(
        `  test.fixme(${JSON.stringify(t.name)}, async ({ ${fixtures} }, testInfo) => {`,
      );
      lines.push(`    // FIXME: ${t.fixme}`);
    } else {
      lines.push(
        `  test(${JSON.stringify(t.name)}, async ({ ${fixtures} }, testInfo) => {`,
      );
    }
    if (t.body && t.body.trim()) {
      lines.push(dedentAndIndent(t.body, "    "));
    }
    lines.push(`  });`);
  }

  emitHooks(lines, "test.afterEach", ir.afterEach);
  emitHooks(lines, "test.afterAll", ir.afterAll);

  lines.push(`});`);
  lines.push("");

  if (ir.tests.length === 0) {
    warnings.push({
      severity: "warn",
      message: `Test spec '${ir.describeName}' contains no tests — emitted as an empty describe block.`,
    });
  }

  return { contents: lines.join("\n"), warnings };
}

function emitHooks(lines: string[], name: string, hooks?: HookIR[]): void {
  if (!hooks || hooks.length === 0) return;
  for (const hook of hooks) {
    lines.push("");
    const fixtures = (hook.fixtures && hook.fixtures.length ? hook.fixtures : ["page"]).join(
      ", ",
    );
    lines.push(`  ${name}(async ({ ${fixtures} }) => {`);
    if (hook.body && hook.body.trim()) {
      lines.push(dedentAndIndent(hook.body, "    "));
    }
    lines.push(`  });`);
  }
}
