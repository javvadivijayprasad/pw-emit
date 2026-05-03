/**
 * Public API for `@vijaypjavvadi/pw-emit`.
 *
 * Stable named exports, SemVer-committed (see README.md).
 */

// Emitters
export { emitPageObject } from "./pageObjectEmitter";
export type { EmitPageObjectOptions } from "./pageObjectEmitter";
export { emitTestSpec } from "./testEmitter";
export { emitProject } from "./projectEmitter";
export type { EmitProjectOptions, EmitProjectResult } from "./projectEmitter";

// Locator rendering
export {
  renderLocatorExpr,
  renderFieldDeclaration,
  renderFieldAssignment,
} from "./locatorRender";

// Naming
export {
  toCamelCase,
  toPascalCase,
  toKebabCase,
  pageObjectFileName,
  testFileName,
} from "./naming";

// Indent
export { dedentAndIndent } from "./indent";

// Types
export type {
  LocatorChoice,
  PageObjectIR,
  PomMethodIR,
  TestSpecIR,
  TestCaseIR,
  HookIR,
  ReviewItem,
  EmitResult,
} from "./types";
