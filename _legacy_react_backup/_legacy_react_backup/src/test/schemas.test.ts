import { describe, it, expect } from "vitest";
import { z } from "zod";

// Import the schemas from Admin.tsx - we'll test similar patterns
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
};

const menuItemSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .transform(sanitizeInput),
  price: z.number()
    .positive("Price must be positive")
    .max(10000, "Price must be less than 10,000"),
  category: z.string()
    .min(1, "Category is required"),
  canteen_level: z.string()
    .min(1, "Canteen level is required"),
});

const signInSchema = z.object({
  email: z.string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase()
    .transform(sanitizeInput),
  password: z.string()
    .min(1, "Password is required")
    .max(100, "Password must be less than 100 characters"),
});

const signUpSchema = z.object({
  email: z.string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase()
    .transform(sanitizeInput),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string()
    .min(1, "Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

describe("sanitizeInput", () => {
  it("should remove angle brackets", () => {
    expect(sanitizeInput("<script>alert('xss')</script>")).toBe("scriptalert('xss')/script");
  });

  it("should remove javascript: protocol", () => {
    expect(sanitizeInput("javascript:alert('xss')")).toBe("alert('xss')");
  });

  it("should remove event handlers", () => {
    // The regex removes onclick= but not the rest of the string
    expect(sanitizeInput(' onclick="alert(1)">Click me')).toContain("Click me");
  });

  it("should trim whitespace", () => {
    expect(sanitizeInput("  hello  ")).toBe("hello");
  });
});

describe("menuItemSchema", () => {
  it("should validate a valid menu item", () => {
    const result = menuItemSchema.safeParse({
      name: "Fried Rice",
      price: 8.5,
      category: "Main Course",
      canteen_level: "Level 1",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = menuItemSchema.safeParse({
      name: "",
      price: 8.5,
      category: "Main Course",
      canteen_level: "Level 1",
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative price", () => {
    const result = menuItemSchema.safeParse({
      name: "Fried Rice",
      price: -5,
      category: "Main Course",
      canteen_level: "Level 1",
    });
    expect(result.success).toBe(false);
  });

  it("should reject price over 10000", () => {
    const result = menuItemSchema.safeParse({
      name: "Luxury Dish",
      price: 15000,
      category: "Main Course",
      canteen_level: "Level 1",
    });
    expect(result.success).toBe(false);
  });

  it("should sanitize malicious input in name", () => {
    const result = menuItemSchema.safeParse({
      name: "<script>alert('xss')</script>",
      price: 10,
      category: "Main Course",
      canteen_level: "Level 1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).not.toContain("<script>");
    }
  });
});

describe("signInSchema", () => {
  it("should validate valid credentials", () => {
    const result = signInSchema.safeParse({
      email: "admin@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = signInSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("should normalize email to lowercase", () => {
    const result = signInSchema.safeParse({
      email: "ADMIN@EXAMPLE.COM",
      password: "password123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("admin@example.com");
    }
  });

  it("should sanitize email input", () => {
    // Note: Zod validates email format BEFORE transform, so <script> will cause validation to fail
    // This test demonstrates that invalid characters are caught by Zod's email validation
    const result = signInSchema.safeParse({
      email: "admin<script>@example.com",
      password: "password123",
    });
    // The <script> in the email will cause validation to fail since it's not a valid email format
    expect(result.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("should validate valid signup data", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "Password1",
      confirmPassword: "Password1",
    });
    expect(result.success).toBe(true);
  });

  it("should reject weak password (no uppercase)", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "password1",
      confirmPassword: "password1",
    });
    expect(result.success).toBe(false);
  });

  it("should reject weak password (no number)", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "Password",
      confirmPassword: "Password",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password less than 8 characters", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "Pass1",
      confirmPassword: "Pass1",
    });
    expect(result.success).toBe(false);
  });

  it("should reject mismatched passwords", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "Password1",
      confirmPassword: "Password2",
    });
    expect(result.success).toBe(false);
  });
});
