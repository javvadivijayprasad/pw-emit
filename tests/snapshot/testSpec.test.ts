import { describe, it, expect } from "vitest";
import { emitTestSpec } from "../../src/testEmitter";
import type { TestSpecIR } from "../../src/types";

const empty: TestSpecIR = {
  describeName: "Nothing yet",
  tests: [],
};

const withBackground: TestSpecIR = {
  describeName: "User Login",
  pomImports: [{ className: "LoginPage", fromPath: "../pages/login.page" }],
  beforeEach: [
    {
      body:
        "const loginPage = new LoginPage(page);\n" + "await loginPage.goto();",
    },
  ],
  tests: [
    {
      name: "Successful login",
      body:
        "const loginPage = new LoginPage(page);\n" +
        'await loginPage.login("alice@example.com", "secret");\n' +
        "await expect(loginPage.dashboardHeading).toBeVisible();",
    },
  ],
};

const withFixme: TestSpecIR = {
  describeName: "Validation errors",
  tests: [
    {
      name: "TBD validation case",
      body: "// pending implementation",
      fixme: "Step matcher had no rule for this Gherkin step.",
    },
  ],
};

describe("emitTestSpec snapshots", () => {
  it("empty describe block surfaces a warning", () => {
    const r = emitTestSpec(empty);
    expect(r.contents).toContain('test.describe("Nothing yet"');
    expect(r.warnings.some((w) => w.message.includes("no tests"))).toBe(true);
  });

  it("background + one test", () => {
    expect(emitTestSpec(withBackground).contents).toMatchInlineSnapshot(`
      "import { test, expect } from "@playwright/test";
      import { LoginPage } from "../pages/login.page";

      test.describe("User Login", () => {

        test.beforeEach(async ({ page }) => {
          const loginPage = new LoginPage(page);
          await loginPage.goto();
        });

        test("Successful login", async ({ page }, testInfo) => {
          const loginPage = new LoginPage(page);
          await loginPage.login("alice@example.com", "secret");
          await expect(loginPage.dashboardHeading).toBeVisible();
        });
      });
      "
    `);
  });

  it("fixme converts to test.fixme()", () => {
    const out = emitTestSpec(withFixme).contents;
    expect(out).toContain("test.fixme(");
    expect(out).toContain("// FIXME: Step matcher had no rule");
  });
});
