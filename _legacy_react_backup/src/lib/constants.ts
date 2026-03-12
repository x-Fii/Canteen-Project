/**
 * Shared constants for the Canteen Project
 * Centralized to avoid duplication across components
 */

// Canteen Levels
export const LEVELS = ["Level 1", "Level 2", "Level 3"] as const;
export type CanteenLevel = (typeof LEVELS)[number];

// Menu Categories
export const CATEGORIES = ["Main Course", "Dessert", "Beverage", "Snacks"] as const;
export type MenuCategory = (typeof CATEGORIES)[number];

// Firebase Collection Names
export const MENU_ITEMS_COLLECTION = "menu_items";
export const USERS_COLLECTION = "users";

// User Roles
export const USER_ROLES = ["admin", "content_manager"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Category Visual Configurations
export const CATEGORY_GRADIENTS: Record<MenuCategory, string> = {
  "Main Course": "category-gradient-main",
  Dessert: "category-gradient-dessert",
  Beverage: "category-gradient-beverage",
  Snacks: "category-gradient-snacks",
};

export const CATEGORY_EMOJIS: Record<MenuCategory, string> = {
  "Main Course": "🍜",
  Dessert: "🥮",
  Beverage: "🍵",
  Snacks: "🥟",
};

// Default Values
export const DEFAULT_LEVEL: CanteenLevel = "Level 1";
export const DEFAULT_CATEGORY: MenuCategory = "Main Course";

// Storage Keys
export const STORAGE_KEYS = {
  CURRENT_LEVEL: "canteen_currentLevel",
} as const;

// Query Keys for React Query
export const QUERY_KEYS = {
  MENU_ITEMS: ["menu_items"] as const,
  USERS: ["users"] as const,
  USER_ROLE: ["user_role"] as const,
} as const;

// Time Constants
export const AUTO_REFRESH_HOUR = 3;
export const AUTO_REFRESH_MINUTE = 0;
export const STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const GC_TIME = 30 * 60 * 1000; // 30 minutes
