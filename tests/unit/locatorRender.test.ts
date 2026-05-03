import { describe, it, expect } from "vitest";
import {
  renderLocatorExpr,
  renderFieldDeclaration,
  renderFieldAssignment,
} from "../../src/locatorRender";
import type { LocatorChoice } from "../../src/types";

const role: LocatorChoice = {
  api: "getByRole",
  args: "'button', { name: 'Sign in' }",
  fieldName: "signInButton",
};

const css: LocatorChoice = {
  api: "locator",
  args: "'#login'",
  fieldName: "loginInput",
};

describe("renderLocatorExpr", () => {
  it("renders getByRole with default page var", () => {
    expect(renderLocatorExpr(role)).toBe("page.getByRole('button', { name: 'Sign in' })");
  });
  it("renders with explicit page var", () => {
    expect(renderLocatorExpr(role, "this.page")).toBe(
      "this.page.getByRole('button', { name: 'Sign in' })",
    );
  });
  it("renders bare locator()", () => {
    expect(renderLocatorExpr(css)).toBe("page.locator('#login')");
  });
});

describe("renderFieldDeclaration", () => {
  it("renders the readonly Locator field line", () => {
    expect(renderFieldDeclaration(role)).toBe("  readonly signInButton: Locator;");
  });
});

describe("renderFieldAssignment", () => {
  it("renders the constructor assignment line", () => {
    expect(renderFieldAssignment(role)).toBe(
      "    this.signInButton = page.getByRole('button', { name: 'Sign in' });",
    );
  });
});
