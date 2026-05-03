/**
 * Naming helpers — pure string transforms. Stable across releases; any
 * change here is a major version bump because emitted file names depend
 * on these functions.
 *
 * Lifted from sel2pw v1.0.0 `src/utils/naming.ts` minus `javaTypeToTs`
 * (which is Java-specific and stays in sel2pw).
 */

/**
 * Convert a string in any common case to camelCase.
 *
 *   LoginPage              -> loginPage
 *   CreateReferral_Link    -> createReferralLink
 *   submit_btn             -> submitBtn
 *   userInput              -> userInput  (already camelCase, untouched)
 */
export function toCamelCase(s: string): string {
  if (!s) return s;
  return (s.charAt(0).toLowerCase() + s.slice(1)).replace(
    /_+([A-Za-z])/g,
    (_, c: string) => c.toUpperCase(),
  );
}

/**
 * Convert a string in any common case to PascalCase.
 *
 *   login-page    -> LoginPage
 *   login_page    -> LoginPage
 *   loginPage     -> LoginPage
 */
export function toPascalCase(s: string): string {
  if (!s) return s;
  const parts = s
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-\s]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join("");
}

/**
 * Convert a string in any common case to kebab-case.
 *
 *   LoginPage     -> login-page
 *   submit_btn    -> submit-btn
 *   userInput     -> user-input
 */
export function toKebabCase(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

/**
 * Compute the file name for a Page Object class.
 *
 *   LoginPage          -> login.page.ts
 *   LoginPages         -> login.page.ts
 *   LoginPageObject    -> login.page.ts
 *   LoginPageObjects   -> login.page.ts
 *   LoginScreen        -> login.page.ts        (mobile-style suffix)
 *   LoginView          -> login.page.ts        (alt convention)
 *   LoginSection / LoginComponent etc. stay as-is — they describe sub-areas, not pages.
 */
export function pageObjectFileName(className: string): string {
  const stripped = toKebabCase(className).replace(
    /-(?:page-objects?|pages?|screens?|views?)$/,
    "",
  );
  return `${stripped}.page.ts`;
}

/**
 * Compute the file name for a test class.
 *
 *   LoginTest      -> login.spec.ts
 *   LoginTests     -> login.spec.ts
 *   LoginTestCase  -> login.spec.ts
 */
export function testFileName(className: string): string {
  return `${toKebabCase(className).replace(/-tests?(?:-?case)?$/, "")}.spec.ts`;
}
