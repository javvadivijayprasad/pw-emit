import { describe, it, expect } from "vitest";
import { dedentAndIndent } from "../../src/indent";

describe("dedentAndIndent", () => {
  it("strips common leading indent and reapplies prefix", () => {
    const body = "        await page.goto(url);\n        await page.click('#login');";
    expect(dedentAndIndent(body, "  ")).toBe(
      "  await page.goto(url);\n  await page.click('#login');",
    );
  });

  it("strips leading and trailing blank lines", () => {
    const body = "\n\n  doSomething();\n\n";
    expect(dedentAndIndent(body, "  ")).toBe("  doSomething();");
  });

  it("preserves nested indentation relative to the minimum", () => {
    const body = "    if (x) {\n      doY();\n    }";
    expect(dedentAndIndent(body, "  ")).toBe("  if (x) {\n    doY();\n  }");
  });

  it("returns empty string for empty input", () => {
    expect(dedentAndIndent("", "    ")).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(dedentAndIndent("\n\n   \n", "    ")).toBe("");
  });

  it("handles tabs as well as spaces", () => {
    const body = "\t\tfoo();\n\t\tbar();";
    expect(dedentAndIndent(body, "  ")).toBe("  foo();\n  bar();");
  });
});
