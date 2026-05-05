import { describe, expect, it } from "vitest";
import { bumpPower, classifyPower, isEmphasized } from "./power";

describe("classifyPower", () => {
  it("treats 1〜10 文字 as light", () => {
    expect(classifyPower("")).toBe("light");
    expect(classifyPower("あ")).toBe("light");
    expect(classifyPower("0123456789")).toBe("light");
  });

  it("treats 11〜40 文字 as normal", () => {
    expect(classifyPower("0123456789a")).toBe("normal");
    expect(classifyPower("x".repeat(40))).toBe("normal");
  });

  it("treats 41 文字以上 as heavy", () => {
    expect(classifyPower("x".repeat(41))).toBe("heavy");
    expect(classifyPower("x".repeat(120))).toBe("heavy");
  });
});

describe("bumpPower", () => {
  it("light → normal, normal → heavy, heavy → heavy", () => {
    expect(bumpPower("light")).toBe("normal");
    expect(bumpPower("normal")).toBe("heavy");
    expect(bumpPower("heavy")).toBe("heavy");
  });
});

describe("isEmphasized", () => {
  it("requires 3 or more emphasis marks (mix of !！?？)", () => {
    expect(isEmphasized("hi")).toBe(false);
    expect(isEmphasized("hi!!")).toBe(false);
    expect(isEmphasized("hi!!!")).toBe(true);
    expect(isEmphasized("なんでだよ！？！")).toBe(true);
    expect(isEmphasized("ありがとう？？")).toBe(false);
    expect(isEmphasized("？！？")).toBe(true);
  });

  it("ignores other punctuation", () => {
    expect(isEmphasized("...")).toBe(false);
    expect(isEmphasized("。。。")).toBe(false);
  });
});
