#!/usr/bin/env node
const path = require("path");
const assert = require("assert");
const fs = require("fs");

let passed = 0, failed = 0;
async function ok(name, fn) {
  try { await fn(); console.log("  PASS  " + name); passed++; }
  catch (e) { console.log("  FAIL  " + name + "\n        " + e.message); failed++; }
}
function group(t) { console.log("\n" + t); }

const dist = path.join(__dirname, "..", "dist");
if (!fs.existsSync(dist)) { console.error("dist/ missing — run tsc first"); process.exit(1); }

const naming = require(path.join(dist, "naming"));
const indent = require(path.join(dist, "indent"));
const lr = require(path.join(dist, "locatorRender"));
const poe = require(path.join(dist, "pageObjectEmitter"));
const te = require(path.join(dist, "testEmitter"));
const pe = require(path.join(dist, "projectEmitter"));
const idx = require(path.join(dist, "index"));

(async () => {
  group("naming");
  await ok("toCamelCase PascalCase", () => assert.strictEqual(naming.toCamelCase("LoginPage"), "loginPage"));
  await ok("toCamelCase snake", () => assert.strictEqual(naming.toCamelCase("submit_btn"), "submitBtn"));
  await ok("toCamelCase mixed", () => assert.strictEqual(naming.toCamelCase("CreateReferral_Link"), "createReferralLink"));
  await ok("toPascalCase kebab", () => assert.strictEqual(naming.toPascalCase("login-page"), "LoginPage"));
  await ok("toPascalCase snake", () => assert.strictEqual(naming.toPascalCase("login_page"), "LoginPage"));
  await ok("toKebabCase Pascal", () => assert.strictEqual(naming.toKebabCase("LoginPage"), "login-page"));
  await ok("pageObjectFileName LoginPage", () => assert.strictEqual(naming.pageObjectFileName("LoginPage"), "login.page.ts"));
  await ok("pageObjectFileName LoginPageObject", () => assert.strictEqual(naming.pageObjectFileName("LoginPageObject"), "login.page.ts"));
  await ok("pageObjectFileName LoginScreen", () => assert.strictEqual(naming.pageObjectFileName("LoginScreen"), "login.page.ts"));
  await ok("pageObjectFileName LoginSection (sub-area, kept)", () => assert.strictEqual(naming.pageObjectFileName("LoginSection"), "login-section.page.ts"));
  await ok("testFileName LoginTest", () => assert.strictEqual(naming.testFileName("LoginTest"), "login.spec.ts"));
  await ok("testFileName LoginTestCase", () => assert.strictEqual(naming.testFileName("LoginTestCase"), "login.spec.ts"));

  group("indent");
  await ok("dedents and reindents", () => {
    const r = indent.dedentAndIndent("        await page.goto(url);\n        await page.click('#login');", "  ");
    assert.strictEqual(r, "  await page.goto(url);\n  await page.click('#login');");
  });
  await ok("strips blank lead/trail", () => assert.strictEqual(indent.dedentAndIndent("\n\n  doX();\n\n", "  "), "  doX();"));
  await ok("preserves nested indent", () => {
    const r = indent.dedentAndIndent("    if (x) {\n      doY();\n    }", "  ");
    assert.strictEqual(r, "  if (x) {\n    doY();\n  }");
  });
  await ok("empty input → empty", () => assert.strictEqual(indent.dedentAndIndent("", "    "), ""));
  await ok("tabs handled", () => assert.strictEqual(indent.dedentAndIndent("\t\tfoo();\n\t\tbar();", "  "), "  foo();\n  bar();"));

  group("locatorRender");
  const role = { api: "getByRole", args: "'button', { name: 'Sign in' }", fieldName: "signInButton" };
  await ok("renders default page var", () => assert.strictEqual(lr.renderLocatorExpr(role), "page.getByRole('button', { name: 'Sign in' })"));
  await ok("renders this.page var", () => assert.strictEqual(lr.renderLocatorExpr(role, "this.page"), "this.page.getByRole('button', { name: 'Sign in' })"));
  await ok("field declaration", () => assert.strictEqual(lr.renderFieldDeclaration(role), "  readonly signInButton: Locator;"));
  await ok("field assignment", () => assert.strictEqual(lr.renderFieldAssignment(role), "    this.signInButton = page.getByRole('button', { name: 'Sign in' });"));

  group("emitPageObject");
  const minimal = { className: "EmptyPage", fields: [], methods: [] };
  await ok("empty class shape", () => {
    const r = poe.emitPageObject(minimal);
    assert.ok(r.contents.includes("export class EmptyPage {"));
    assert.ok(r.contents.includes("constructor(page: Page) {"));
    assert.ok(r.contents.includes("this.page = page;"));
  });
  const login = {
    className: "LoginPage",
    fields: [
      { api: "getByLabel", args: "'Username'", fieldName: "usernameInput" },
      { api: "getByRole", args: "'button', { name: 'Sign in' }", fieldName: "signInButton" },
    ],
    methods: [
      { name: "login", params: [{ name: "u", type: "string" }], body: "await this.usernameInput.fill(u);\nawait this.signInButton.click();" },
    ],
  };
  await ok("multi-field + method", () => {
    const r = poe.emitPageObject(login);
    assert.ok(r.contents.includes("readonly usernameInput: Locator;"));
    assert.ok(r.contents.includes("this.signInButton = page.getByRole('button', { name: 'Sign in' });"));
    assert.ok(r.contents.includes("async login(u: string): Promise<void> {"));
    assert.ok(r.contents.includes("    await this.usernameInput.fill(u);"));
  });
  await ok("self-healing shim wraps", () => {
    const r = poe.emitPageObject(login, { selfHealingShim: true });
    assert.ok(r.contents.includes('import { healOrThrow } from'));
    assert.ok(r.contents.includes("healOrThrow(page, {"));
    assert.ok(r.contents.includes('context: { page: "LoginPage", name: "usernameInput" }'));
  });
  await ok("custom return type honored", () => {
    const r = poe.emitPageObject({ className: "DashboardPage", fields: [], methods: [
      { name: "getUserName", params: [], returnType: "Promise<string>", body: "return 'Alice';" },
    ]});
    assert.ok(r.contents.includes("async getUserName(): Promise<string> {"));
  });
  await ok("duplicate fields warn", () => {
    const r = poe.emitPageObject({ className: "Dup", fields: [
      { api: "locator", args: "'#a'", fieldName: "a" },
      { api: "locator", args: "'#b'", fieldName: "a" },
    ], methods: [] });
    assert.ok(r.warnings.some((w) => w.message.includes("Duplicate")));
  });

  group("emitTestSpec");
  const spec = {
    describeName: "User Login",
    pomImports: [{ className: "LoginPage", fromPath: "../pages/login.page" }],
    beforeEach: [{ body: "const loginPage = new LoginPage(page);\nawait loginPage.goto();" }],
    tests: [{ name: "Successful login", body: "await loginPage.login('a','b');" }],
  };
  await ok("renders describe + import + hook + test", () => {
    const r = te.emitTestSpec(spec);
    assert.ok(r.contents.includes('test.describe("User Login", () => {'));
    assert.ok(r.contents.includes('import { LoginPage } from "../pages/login.page";'));
    assert.ok(r.contents.includes("test.beforeEach(async ({ page }) => {"));
    assert.ok(r.contents.includes('test("Successful login", async ({ page }) => {'));
  });
  await ok("empty tests warns", () => {
    const r = te.emitTestSpec({ describeName: "X", tests: [] });
    assert.ok(r.warnings.some((w) => w.message.includes("no tests")));
  });
  await ok("fixme converts", () => {
    const r = te.emitTestSpec({ describeName: "X", tests: [
      { name: "TBD", body: "// later", fixme: "no rule" },
    ]});
    assert.ok(r.contents.includes("test.fixme("));
    assert.ok(r.contents.includes("// FIXME: no rule"));
  });

  group("emitProject");
  const tmp = path.join(require("os").tmpdir(), "pwemit-verify-" + Date.now());
  await ok("scaffolds 4 files into a fresh dir", async () => {
    const r = await pe.emitProject({ outDir: tmp, projectName: "demo", baseUrl: "https://demo.test" });
    assert.strictEqual(r.filesWritten.length, 4);
    assert.ok(fs.readFileSync(path.join(tmp, "package.json"), "utf8").includes('"name": "demo"'));
    assert.ok(fs.readFileSync(path.join(tmp, "playwright.config.ts"), "utf8").includes("https://demo.test"));
    assert.ok(fs.existsSync(path.join(tmp, "pages")));
    assert.ok(fs.existsSync(path.join(tmp, "tests")));
  });
  await ok("idempotent — second call writes nothing, all warnings", async () => {
    const r = await pe.emitProject({ outDir: tmp, projectName: "demo", baseUrl: "https://demo.test" });
    assert.strictEqual(r.filesWritten.length, 0);
    assert.strictEqual(r.warnings.filter((w) => w.severity === "info").length, 4);
  });

  group("public index re-exports");
  await ok("emitters exported", () => {
    assert.strictEqual(typeof idx.emitPageObject, "function");
    assert.strictEqual(typeof idx.emitTestSpec, "function");
    assert.strictEqual(typeof idx.emitProject, "function");
  });
  await ok("naming + indent + locator helpers exported", () => {
    assert.strictEqual(typeof idx.toCamelCase, "function");
    assert.strictEqual(typeof idx.dedentAndIndent, "function");
    assert.strictEqual(typeof idx.renderLocatorExpr, "function");
  });

  console.log("\n" + passed + " passed, " + failed + " failed");
  process.exit(failed === 0 ? 0 : 1);
})();
