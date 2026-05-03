/**
 * Render a `PageObjectIR` as a Playwright TypeScript Page Object class.
 *
 * Output shape (without `selfHealingShim`):
 *
 *   import { Page, Locator, expect } from "@playwright/test";
 *
 *   export class LoginPage {
 *     readonly page: Page;
 *     readonly usernameInput: Locator;
 *     readonly passwordInput: Locator;
 *
 *     constructor(page: Page) {
 *       this.page = page;
 *       this.usernameInput = page.getByLabel("Username");
 *       this.passwordInput = page.getByLabel("Password");
 *     }
 *
 *     async login(user: string, pass: string): Promise<void> {
 *       await this.usernameInput.fill(user);
 *       ...
 *     }
 *   }
 *
 * With `selfHealingShim: true`, locator initialisation is wrapped so
 * the converted Page Object integrates with `self-healing-stage-services`
 * at runtime:
 *
 *     this.usernameInput = healOrThrow(page, {
 *       preferred: page.getByLabel("Username"),
 *       context: { page: "LoginPage", name: "usernameInput" },
 *     });
 *
 * The `healOrThrow` helper is expected to be provided by
 * `@platform/sdk-self-healing` in the consuming project.
 */

import type { EmitResult, PageObjectIR, ReviewItem } from "./types";
import {
  renderFieldAssignment,
  renderFieldDeclaration,
  renderLocatorExpr,
} from "./locatorRender";
import { dedentAndIndent } from "./indent";

export interface EmitPageObjectOptions {
  /** Wrap locator initialisers in `healOrThrow(...)`. Defaults to false. */
  selfHealingShim?: boolean;
}

export function emitPageObject(
  ir: PageObjectIR,
  opts: EmitPageObjectOptions = {},
): EmitResult {
  const warnings: ReviewItem[] = [];
  const lines: string[] = [];

  // Imports
  lines.push(`import { Page, Locator, expect } from "@playwright/test";`);
  if (opts.selfHealingShim) {
    lines.push(`import { healOrThrow } from "@platform/sdk-self-healing";`);
  }
  if (ir.extraImports && ir.extraImports.length) {
    for (const imp of ir.extraImports) lines.push(imp);
  }
  lines.push("");

  // Class header + field declarations
  lines.push(`export class ${ir.className} {`);
  lines.push(`  readonly page: Page;`);
  for (const f of ir.fields) {
    lines.push(renderFieldDeclaration(f));
  }
  lines.push("");

  // Constructor
  lines.push(`  constructor(page: Page) {`);
  lines.push(`    this.page = page;`);
  for (const f of ir.fields) {
    if (opts.selfHealingShim) {
      const preferred = renderLocatorExpr(f, "page");
      lines.push(`    this.${f.fieldName} = healOrThrow(page, {`);
      lines.push(`      preferred: ${preferred},`);
      lines.push(
        `      context: { page: ${JSON.stringify(ir.className)}, name: ${JSON.stringify(f.fieldName)} },`,
      );
      lines.push(`    });`);
    } else {
      lines.push(renderFieldAssignment(f, "page"));
    }
  }
  lines.push(`  }`);

  // Methods
  for (const m of ir.methods) {
    lines.push("");
    if (m.jsdoc) {
      for (const docLine of m.jsdoc.split("\n")) {
        lines.push("  " + docLine);
      }
    }
    const tsParams = m.params.map((p) => `${p.name}: ${p.type}`).join(", ");
    const ret = m.returnType ?? "Promise<void>";
    lines.push(`  async ${m.name}(${tsParams}): ${ret} {`);
    if (m.body && m.body.trim()) {
      lines.push(dedentAndIndent(m.body, "    "));
    }
    lines.push(`  }`);
  }

  lines.push(`}`);
  lines.push("");

  // Lightweight self-checks
  const seen = new Set<string>();
  for (const f of ir.fields) {
    if (seen.has(f.fieldName)) {
      warnings.push({
        severity: "warn",
        message: `Duplicate field name '${f.fieldName}' in ${ir.className}`,
      });
    }
    seen.add(f.fieldName);
  }

  return { contents: lines.join("\n"), warnings };
}
