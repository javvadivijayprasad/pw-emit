/**
 * Render a `LocatorChoice` as a Playwright TypeScript expression.
 *
 * The caller has already decided which API to use and constructed the
 * `args` string. This module's job is to:
 *   - prefix the page variable
 *   - render the field declaration line
 *   - render the constructor assignment line
 *
 * Selenium-specific decision logic (parsing `By.id` / `By.xpath` /
 * `@FindBy` annotations into a `LocatorChoice`) lives in sel2pw, NOT
 * here. bdd2pw makes its own `LocatorChoice` decisions from the
 * Playwright MCP accessibility-tree snapshot.
 */

import type { LocatorChoice } from "./types";

/**
 * Render the locator expression itself.
 *
 *   { api: 'getByRole', args: "'button', { name: 'Sign in' }" }
 *   → "page.getByRole('button', { name: 'Sign in' })"
 */
export function renderLocatorExpr(
  choice: LocatorChoice,
  pageVar: string = "page",
): string {
  return `${pageVar}.${choice.api}(${choice.args})`;
}

/**
 * Render a class field declaration line.
 *
 *   "  readonly usernameInput: Locator;"
 */
export function renderFieldDeclaration(choice: LocatorChoice): string {
  return `  readonly ${choice.fieldName}: Locator;`;
}

/**
 * Render the constructor assignment line.
 *
 *   "    this.usernameInput = page.getByLabel('Username');"
 */
export function renderFieldAssignment(
  choice: LocatorChoice,
  pageVar: string = "page",
): string {
  return `    this.${choice.fieldName} = ${renderLocatorExpr(choice, pageVar)};`;
}
