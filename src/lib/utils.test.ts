import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("should merge basic class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("should merge objects", () => {
    expect(cn("a", { b: true, c: false })).toBe("a b");
  });

  it("should merge arrays", () => {
    expect(cn(["a", "b"])).toBe("a b");
  });

  it("should handle tailwind-merge functionality", () => {
    // p-2 and p-4 conflict, so the later one (p-4) should win
    expect(cn("p-2", "p-4")).toBe("p-4");

    // Test custom tailwind merge rules if necessary, but basic conflict resolution is sufficient
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("should handle falsy values correctly", () => {
    expect(cn("a", null, undefined, false, 0, "", "b")).toBe("a b");
  });

  it("should handle complex nested combinations", () => {
    expect(cn(
      "base-class",
      ["array-class-1", "array-class-2"],
      { "obj-class-1": true, "obj-class-2": false },
      "p-2 p-4", // tailwind conflict in a single string (handled by twMerge usually? no, twMerge parses words. Actually "p-2 p-4" gives "p-4")
      null,
      undefined
    )).toBe("base-class array-class-1 array-class-2 obj-class-1 p-4");
  });
});
