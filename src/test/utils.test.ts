import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("should merge class names", () => {
    const result = cn("foo", "bar");
    expect(result).toBe("foo bar");
  });

  it("should handle conflicting tailwind classes", () => {
    const result = cn("p-4", "p-2");
    // tailwind-merge should resolve conflicts, keeping the last one
    expect(result).toContain("p-2");
  });

  it("should handle conditional classes", () => {
    const result = cn("foo", false && "bar", "baz");
    expect(result).toBe("foo baz");
  });

  it("should handle empty inputs", () => {
    const result = cn();
    expect(result).toBe("");
  });
});
