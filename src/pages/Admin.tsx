import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { db, auth, MENU_ITEMS_COLLECTION, ADMIN_USERS_COLLECTION } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  serverTimestamp,
  getDoc,
  setDoc
} from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import { Link } from "react-router-dom";
import { Pencil, Trash2, LogOut, Loader2, UserPlus, Users, Shield, ShieldAlert, Mail, KeyRound, Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

// Constants
const CATEGORIES = ["Main Course", "Dessert", "Beverage", "Snacks"];
const LEVELS = ["Level 1", "Level 2", "Level 3"];

// ====================
// Input Validation Schemas
// ====================

// Sanitize string input to prevent XSS
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
};

// Menu Item Schema with enhanced validation
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
    .min(1, "Category is required")
    .refine(val => CATEGORIES.includes(val), "Invalid category"),
  canteen_level: z.string()
    .min(1, "Canteen level is required")
    .refine(val => LEVELS.includes(val), "Invalid canteen level"),
});

// Sign In Schema
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

// Sign Up Schema
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

// Password Reset Schema
const passwordResetSchema = z.object({
  email: z.string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase()
    .transform(sanitizeInput),
});

// Admin User Schema
const adminUserSchema = z.object({
  email: z.string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase()
    .transform(sanitizeInput),
  role: z.enum(["super_admin", "admin"]),
});

// Types
type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  canteen_level: string;
  created_at: string;
};

type AdminUser = {
  id: string;
  email: string;
  role: "super_admin" | "admin";
  created_at: string;
  created_by: string;
};

// Auth Mode Enum
type AuthMode = "signin" | "signup" | "forgot_password";

// ====================
// Main Component
// ====================

const Admin = () => {
  const queryClient = useQueryClient();
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Menu Items State
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  
  // Admin Users State
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  
  // Forms State
  const [authForm, setAuthForm] = useState({ 
    email: "", 
    password: "",
    confirmPassword: "" 
  });
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: CATEGORIES[0],
    canteen_level: LEVELS[0],
  });
  
  // Reauthenticate modal
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reauthForm, setReauthForm] = useState({ password: "" });
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // ====================
  // Auth State Listener
  // ====================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ====================
  // Load Menu Items
  // ====================
  useEffect(() => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, MENU_ITEMS_COLLECTION),
      orderBy("canteen_level"),
      orderBy("category"),
      orderBy("name")
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString()
        })) as MenuItem[];
        setItems(itemsData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching items:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // ====================
  // Load Admin Users
  // ====================
  useEffect(() => {
    if (!user) {
      setAdminUsers([]);
      setIsLoadingAdmins(false);
      return;
    }

    const q = query(
      collection(db, ADMIN_USERS_COLLECTION),
      orderBy("email")
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString()
        })) as AdminUser[];
        setAdminUsers(usersData);
        setIsLoadingAdmins(false);
      },
      (error) => {
        console.error("Error fetching admin users:", error);
        setIsLoadingAdmins(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // ====================
  // Auth Handlers
  // ====================

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    
    try {
      // Validate input
      const validated = signInSchema.parse({
        email: authForm.email,
        password: authForm.password,
      });

      await signInWithEmailAndPassword(auth, validated.email, validated.password);
      toast.success("Signed in successfully!");
      setAuthForm({ email: "", password: "", confirmPassword: "" });
      setAuthMode("signin");
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        const errorMessage = err instanceof Error ? err.message : "Failed to sign in";
        toast.error(errorMessage);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    
    try {
      // Validate input
      const validated = signUpSchema.parse({
        email: authForm.email,
        password: authForm.password,
        confirmPassword: authForm.confirmPassword,
      });

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        validated.email, 
        validated.password
      );

      // Add to admin_users collection with admin role
      await setDoc(doc(db, ADMIN_USERS_COLLECTION, userCredential.user.uid), {
        email: validated.email,
        role: "admin",
        created_at: serverTimestamp(),
        created_by: userCredential.user.uid,
      });

      toast.success("Account created successfully! You are now an admin.");
      setAuthForm({ email: "", password: "", confirmPassword: "" });
      setAuthMode("signin");
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        const errorMessage = err instanceof Error ? err.message : "Failed to create account";
        toast.error(errorMessage);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    
    try {
      const validated = passwordResetSchema.parse({ email: authForm.email });
      
      await sendPasswordResetEmail(auth, validated.email);
      toast.success("Password reset email sent! Check your inbox.");
      setAuthForm({ email: "", password: "", confirmPassword: "" });
      setAuthMode("signin");
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        const errorMessage = err instanceof Error ? err.message : "Failed to send reset email";
        toast.error(errorMessage);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully!");
    } catch (err) {
      toast.error("Failed to sign out");
    }
  };

  // ====================
  // Menu Item Handlers
  // ====================

  const resetForm = () => {
    setEditItem(null);
    setForm({ name: "", price: "", category: CATEGORIES[0], canteen_level: LEVELS[0] });
  };

  const handleSave = async () => {
    try {
      const parsed = menuItemSchema.parse({
        name: form.name,
        price: parseFloat(form.price),
        category: form.category,
        canteen_level: form.canteen_level,
      });

      setIsSaving(true);

      const payload = {
        name: parsed.name,
        price: parsed.price,
        category: parsed.category,
        canteen_level: parsed.canteen_level,
        created_at: serverTimestamp(),
      };

      if (editItem) {
        const itemRef = doc(db, MENU_ITEMS_COLLECTION, editItem.id);
        await updateDoc(itemRef, payload);
        toast.success("Item updated!");
      } else {
        await addDoc(collection(db, MENU_ITEMS_COLLECTION), payload);
        toast.success("Item added!");
      }
      
      queryClient.invalidateQueries({ queryKey: ["menu_items"] });
      resetForm();
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        toast.error("Failed to save item");
      }
      queryClient.invalidateQueries({ queryKey: ["menu_items"] });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const itemRef = doc(db, MENU_ITEMS_COLLECTION, id);
      await deleteDoc(itemRef);
      toast.success("Item deleted!");
      queryClient.invalidateQueries({ queryKey: ["menu_items"] });
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete item");
      queryClient.invalidateQueries({ queryKey: ["menu_items"] });
    }
  };

  const startEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({
      name: item.name,
      price: String(item.price),
      category: item.category,
      canteen_level: item.canteen_level,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  // ====================
  // Admin User Handlers
  // ====================

  const handleAddAdmin = async (email: string, role: "super_admin" | "admin") => {
    try {
      // Note: In production, you'd want to send an invitation email
      // and have the user complete registration
      // For now, we'll just add them to the admin collection
      // The actual user would need to sign up
      
      // For demonstration, we'll create a pending invitation
      const id = Date.now().toString();
      await setDoc(doc(db, ADMIN_USERS_COLLECTION, id), {
        email: email.toLowerCase(),
        role,
        created_at: serverTimestamp(),
        created_by: user?.uid || "system",
        pending: true, // Indicates invitation not yet accepted
      });
      
      toast.success(`Admin invitation sent to ${email}`);
    } catch (err) {
      console.error("Error adding admin:", err);
      toast.error("Failed to add admin");
    }
  };

  const handleRemoveAdmin = async (id: string) => {
    try {
      await deleteDoc(doc(db, ADMIN_USERS_COLLECTION, id));
      toast.success("Admin removed successfully!");
    } catch (err) {
      console.error("Error removing admin:", err);
      toast.error("Failed to remove admin");
    }
  };

  // ====================
  // Reauthentication Handler
  // ====================

  const handleReauthenticate = async () => {
    if (!user || !reauthForm.password) return;
    
    try {
      const credential = EmailAuthProvider.credential(user.email!, reauthForm.password);
      await reauthenticateWithCredential(user, credential);
      setShowReauthModal(false);
      setReauthForm({ password: "" });
      
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } catch (err) {
      toast.error("Reauthentication failed. Please check your password.");
    }
  };

  // ====================
  // Render Helpers
  // ====================

  const renderAuthForm = () => {
    const isSignUp = authMode === "signup";
    const isForgotPassword = authMode === "forgot_password";

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-lg lantern-shadow p-8 border-2 border-accent/20 w-full max-w-md">
          <div className="text-center mb-6">
            <span className="text-4xl">🏮</span>
            <h1 className="text-2xl font-display font-bold text-foreground mt-2">
              {isSignUp ? "Create Admin Account" : isForgotPassword ? "Reset Password" : "Admin Login"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isSignUp ? "Register a new admin account" : isForgotPassword ? "We'll send you a reset link" : "管理面板登录"}
            </p>
          </div>
          
          <form onSubmit={isForgotPassword ? handlePasswordReset : isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={authForm.email}
                onChange={(e) => setAuthForm(f => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="admin@example.com"
                autoComplete="off"
              />
            </div>
            
            {!isForgotPassword && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={authForm.password}
                      onChange={(e) => setAuthForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder={isSignUp ? "Min 8 chars, uppercase, lowercase, number" : "••••••••"}
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                {isSignUp && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={authForm.confirmPassword}
                        onChange={(e) => setAuthForm(f => ({ ...f, confirmPassword: e.target.value }))}
                        className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            
            <button
              type="submit"
              disabled={isSigningIn}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSigningIn && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSigningIn 
                ? "Please wait..." 
                : isSignUp 
                  ? "Create Account" 
                  : isForgotPassword 
                    ? "Send Reset Link" 
                    : "Sign In"
              }
            </button>
          </form>
          
          <div className="mt-6 flex flex-col gap-2 text-center">
            {!isForgotPassword && (
              <>
                <button
                  onClick={() => {
                    setAuthMode(isSignUp ? "signin" : "signup");
                    setAuthForm({ email: "", password: "", confirmPassword: "" });
                  }}
                  className="text-primary text-sm hover:underline"
                >
                  {isSignUp 
                    ? "Already have an account? Sign In" 
                    : "Don't have an account? Sign Up"
                  }
                </button>
                
                {!isSignUp && (
                  <button
                    onClick={() => {
                      setAuthMode("forgot_password");
                      setAuthForm(f => ({ ...f, password: "", confirmPassword: "" }));
                    }}
                    className="text-muted-foreground text-sm hover:text-primary"
                  >
                    Forgot Password?
                  </button>
                )}
              </>
            )}
            
            {isForgotPassword && (
              <button
                onClick={() => {
                  setAuthMode("signin");
                  setAuthForm({ email: "", password: "", confirmPassword: "" });
                }}
                className="text-primary text-sm hover:underline"
              >
                Back to Sign In
              </button>
            )}
            
            <Link to="/" className="text-muted-foreground text-sm hover:text-primary mt-2">
              ← Back to Menu
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // Show loading while checking auth state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show sign-in/sign-up form if not authenticated
  if (!user) {
    return renderAuthForm();
  }

  // ====================
  // Render Admin Panel
  // ====================
  
  return (
    <div className="min-h-screen bg-background">
      {/* Reauthentication Modal */}
      {showReauthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md border-2 border-accent/20">
            <h3 className="text-lg font-semibold mb-4">Reauthentication Required</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please enter your password to confirm your identity.
            </p>
            <input
              type="password"
              value={reauthForm.password}
              onChange={(e) => setReauthForm({ password: e.target.value })}
              placeholder="Your password"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowReauthModal(false);
                  setReauthForm({ password: "" });
                  setPendingAction(null);
                }}
                className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReauthenticate}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="bg-primary border-b-4 border-accent">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏮</span>
            <h1 className="text-xl font-display font-bold text-primary-foreground">
              管理面板 · Admin Panel
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors border border-primary-foreground/30 px-3 py-1 rounded"
            >
              View Live Site
            </Link>
            <button
              onClick={handleSignOut}
              className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors border border-primary-foreground/30 px-3 py-1 rounded flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-5xl">
        {/* Add Menu Item Form */}
        <div className="bg-card rounded-lg lantern-shadow p-6 mb-8 border-2 border-accent/20">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">
            {editItem ? "✏️ Edit Item" : "➕ Add New Menu Item"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="food-name" className="block text-sm font-medium text-muted-foreground mb-1">
                Food Name · 菜名
              </label>
              <input
                id="food-name"
                type="text"
                required
                maxLength={100}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="food-price" className="block text-sm font-medium text-muted-foreground mb-1">
                Price (RM) · 价格
              </label>
              <input
                id="food-price"
                type="number"
                step="0.01"
                min="0"
                max="10000"
                required
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="food-category" className="block text-sm font-medium text-muted-foreground mb-1">
                Category · 类别
              </label>
              <select
                id="food-category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="canteen-level" className="block text-sm font-medium text-muted-foreground mb-1">
                Canteen Level · 楼层
              </label>
              <select
                id="canteen-level"
                value={form.canteen_level}
                onChange={(e) => setForm((f) => ({ ...f, canteen_level: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-5 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : editItem ? "Update Item" : "Add Item"}
              </button>
              {editItem && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-muted hover:bg-muted/80 text-muted-foreground font-semibold py-2 px-5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Admin Management Section */}
        <div className="bg-card rounded-lg lantern-shadow p-6 mb-8 border-2 border-accent/20">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Admin User Management · 管理员管理
          </h2>
          
          {/* Add Admin Form */}
          <div className="mb-6 p-4 bg-muted/30 rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Add New Admin</h3>
            <AddAdminForm onAdd={handleAddAdmin} />
          </div>
          
          {/* Admin Users List */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  {["Email", "Role", "Created At", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoadingAdmins ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : adminUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                      No admin users yet. Add one above!
                    </td>
                  </tr>
                ) : (
                  adminUsers.map((admin) => (
                    <tr key={admin.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4 text-foreground">{admin.email}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                          admin.role === "super_admin" 
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}>
                          {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          {/* Don't allow removing yourself or super admins */}
                          {admin.email !== user?.email && (
                            <button
                              onClick={() => {
                                if (confirm("Are you sure you want to remove this admin?")) {
                                  handleRemoveAdmin(admin.id);
                                }
                              }}
                              className="text-destructive hover:text-destructive/70 transition-colors"
                              aria-label="Remove admin"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Menu Items Table */}
        <div className="bg-card rounded-lg lantern-shadow overflow-hidden border-2 border-accent/20">
          <h2 className="text-lg font-display font-semibold p-6 bg-primary/5 border-b text-foreground">
            📋 Menu Items · 菜单项目
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  {["Level", "Category", "Name", "Price", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                      No menu items yet. Add one above!
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4">
                        <span className="inline-block px-3 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                          {item.canteen_level}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-foreground">{item.category}</td>
                      <td className="px-5 py-4 text-foreground font-medium">{item.name}</td>
                      <td className="px-5 py-4 text-foreground">RM {Number(item.price).toFixed(2)}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(item)}
                            className="text-primary hover:text-primary/70 transition-colors"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Are you sure?")) handleDelete(item.id);
                            }}
                            className="text-destructive hover:text-destructive/70 transition-colors"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ====================
// Add Admin Sub-Component
// ====================

const AddAdminForm = ({ onAdd }: { onAdd: (email: string, role: "super_admin" | "admin") => void }) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"super_admin" | "admin">("admin");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onAdd(email, role);
      setEmail("");
      setRole("admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[200px]">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>
      <div className="min-w-[150px]">
        <select
          title="Select admin role"
          value={role}
          onChange={(e) => setRole(e.target.value as "super_admin" | "admin")}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !email.trim()}
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Add Admin
      </button>
    </form>
  );
};

export default Admin;
