/**
 * Validation schemas for the Canteen Project
 * Centralized Zod schemas for consistent validation across the app
 */

import { z } from "zod";
import { CATEGORIES, LEVELS, USER_ROLES, type MenuCategory, type CanteenLevel } from "./constants";

// ====================
// Utility Functions
// ====================

/**
 * Sanitize string input to prevent XSS attacks
 * Removes dangerous HTML tags, JavaScript protocols, and event handlers
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers like onclick=
    .trim();
};

// ====================
// Menu Item Schemas
// ====================

export const menuItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .transform(sanitizeInput),
  price: z
    .number()
    .positive("Price must be positive")
    .max(10000, "Price must be less than 10,000"),
  category: z
    .string()
    .min(1, "Category is required")
    .refine((val): val is MenuCategory => CATEGORIES.includes(val as MenuCategory), {
      message: `Invalid category. Must be one of: ${CATEGORIES.join(", ")}`,
    }),
  canteen_level: z
    .string()
    .min(1, "Canteen level is required")
    .refine((val): val is CanteenLevel => LEVELS.includes(val as CanteenLevel), {
      message: `Invalid canteen level. Must be one of: ${LEVELS.join(", ")}`,
    }),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;

// ====================
// Authentication Schemas
// ====================

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase()
    .transform(sanitizeInput),
  password: z
    .string()
    .min(1, "Password is required")
    .max(100, "Password must be less than 100 characters"),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Invalid email format")
      .toLowerCase()
      .transform(sanitizeInput),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be less than 100 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export const passwordResetSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase()
    .transform(sanitizeInput),
});

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

// ====================
// User Management Schemas
// ====================

export const createUserSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase()
    .transform(sanitizeInput),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z
    .string()
    .min(1, "Role is required")
    .refine((val): val is (typeof USER_ROLES)[number] => USER_ROLES.includes(val as (typeof USER_ROLES)[number]), {
      message: `Invalid role. Must be one of: ${USER_ROLES.join(", ")}`,
    }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// ====================
// Type Exports
// ====================

export type { MenuCategory, CanteenLevel };
