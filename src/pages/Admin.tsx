import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  db, 
  auth, 
  USERS_COLLECTION,
  MENU_ITEMS_COLLECTION, 
  getUserRole, 
  UserRole, 
  createUserCallable, 
  getUsersCallable, 
  deleteUserCallable, 
  updateUserRoleCallable,
  useAdminStatus,
  bootstrapAdminUser,
  fetchAllUsers,
  fetchAllUsersOnce,
  UserData
} from "@/lib/firebase-new";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { Link } from "react-router-dom";
import { Pencil, Trash2, LogOut, Loader2, Eye, EyeOff, UserPlus, Users, Shield, ShieldOff, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { CreateUserModal } from "@/components/CreateUserModal";

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

// Types
type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  canteen_level: string;
  created_at: string;
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

  // User Management State - Using useAdminStatus hook for Firestore-based admin check
  const { isAdmin: isAdminFromHook, isLoading: isAdminLoading } = useAdminStatus();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<Array<{
    uid: string;
    email: string | null;
    role: string;
    createdAt: string;
    lastSignIn: string;
  }>>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<Error | null>(null);
  const [isUsersEmpty, setIsUsersEmpty] = useState(false);
  const [showCreateUserPopup, setShowCreateUserPopup] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    password: "",
    role: "content_manager" as UserRole,
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  // ====================
  // Update lastSignIn in Firestore (client-side)
  // ====================
  const updateLastSignIn = async (uid: string) => {
    try {
      const userDocRef = doc(db, USERS_COLLECTION, uid);
      await updateDoc(userDocRef, {
        lastSignInAt: serverTimestamp(),
        lastSignIn: new Date().toISOString(),
      });
      console.log("[Auth] Updated lastSignIn in Firestore");
    } catch (error) {
      console.warn("[Auth] Could not update lastSignIn:", error);
    }
  };

  // ====================
  // Auth State Listener
  // ====================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setIsAuthLoading(false);
      
      // Bootstrap admin user on first login if they have admin claims but no Firestore document
      if (user) {
        try {
          const bootstrapResult = await bootstrapAdminUser();
          if (bootstrapResult.isBootstrap) {
            toast.success("Welcome! Your admin profile has been created.");
          }
          
          // Update lastSignIn in Firestore (client-side)
          await updateLastSignIn(user.uid);
        } catch (error) {
          console.error("Bootstrap error:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // ====================
  // Load User Role and Check Admin Status - Using useAdminStatus hook
  // ====================
  useEffect(() => {
    if (user) {
      // Use the hook's isAdminFromHook value
      if (isAdminFromHook) {
        setIsAdmin(true);
        fetchUsers();
      } else {
        setIsAdmin(false);
        setUsers([]);
      }
    } else {
      setUserRole(null);
      setIsAdmin(false);
      setUsers([]);
    }
  }, [user, isAdminFromHook]);

  // ====================
  // Fetch Users (Admin Only) - with error handling
  // ====================
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    setUsersError(null);
    setIsUsersEmpty(false);
    
    try {
      // Try using the callable function first (more reliable for admins)
      const result = await getUsersCallable();
      if (result.data.success) {
        setUsers(result.data.users);
        setIsUsersEmpty(result.data.users.length === 0);
      }
    } catch (error) {
      console.error("Error fetching users via callable:", error);
      
      // Fallback: try direct Firestore query with fetchAllUsersOnce
      try {
        const { users: directUsers, error: directError, isEmpty } = await fetchAllUsersOnce();
        
        if (directError) {
          // Check if it's a permission error
          if (directError.message.includes("Permission Denied") || directError.message.includes("admin privileges")) {
            setUsersError(new Error("You don't have admin privileges to view users. Please check your role in Firebase."));
            toast.error("Access denied: Admin privileges required");
          } else {
            setUsersError(directError);
            toast.error(directError.message);
          }
        } else {
          setUsers(directUsers);
          setIsUsersEmpty(isEmpty);
        }
      } catch (fallbackError) {
        console.error("Fallback fetch also failed:", fallbackError);
        setUsersError(error instanceof Error ? error : new Error("Failed to load users"));
        toast.error("Failed to load users");
      }
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // ====================
  // Create User Handler
  // ====================
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    
    try {
      if (!newUserForm.email || !newUserForm.password) {
        toast.error("Email and password are required");
        return;
      }

      const result = await createUserCallable({
        email: newUserForm.email,
        password: newUserForm.password,
        role: newUserForm.role,
      });

      if (result.data.success) {
        toast.success(`User created successfully as ${result.data.role}!`);
        setNewUserForm({ email: "", password: "", role: "content_manager" });
        setShowCreateUserPopup(false);
        fetchUsers();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create user";
      toast.error(errorMessage);
    } finally {
      setIsCreatingUser(false);
    }
  };

  // ====================
  // Delete User Handler
  // ====================
  const handleDeleteUser = async (uid: string, role: string) => {
    if (role === "admin") {
      toast.error("Admins cannot be deleted via UI. Please use Firebase Console.");
      return;
    }

    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const result = await deleteUserCallable({ uid });
      if (result.data.success) {
        toast.success("User deleted successfully!");
        fetchUsers();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
      toast.error(errorMessage);
    }
  };

  // ====================
  // Update User Role Handler
  // ====================
  const handleUpdateUserRole = async (uid: string, newRole: UserRole, currentRole: string) => {
    if (currentRole === "admin" && newRole !== "admin") {
      toast.error("Admins cannot modify other Admins.");
      return;
    }

    try {
      const result = await updateUserRoleCallable({ uid, role: newRole });
      if (result.data.success) {
        toast.success(`User role updated to ${newRole}!`);
        fetchUsers();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update user role";
      toast.error(errorMessage);
    }
  };

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
      await createUserWithEmailAndPassword(
        auth, 
        validated.email, 
        validated.password
      );

      toast.success("Account created successfully! You can now manage the menu.");
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
            {!isForgotPassword && !isSignUp && (
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

        {/* User Management Section - Admin Only */}
        {isAdmin && (
          <div className="bg-card rounded-lg lantern-shadow overflow-hidden border-2 border-accent/20 mt-8">
            <div className="p-6 bg-primary/5 border-b flex justify-between items-center">
              <h2 className="text-lg font-display font-semibold text-foreground">
                👥 User Management · 用户管理
              </h2>
              <button
                onClick={() => setShowCreateUserPopup(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add User
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    {["Email", "Role", "Created", "Last Sign In", "Actions"].map((h) => (
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
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : usersError ? (
                    // Error State - Show fallback UI
                    <tr>
                      <td colSpan={5} className="px-5 py-8">
                        <div className="flex flex-col items-center gap-4">
                          <div className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            <span className="font-medium">{usersError.message}</span>
                          </div>
                          <p className="text-muted-foreground text-sm text-center">
                            This usually means your user document doesn't exist in Firestore or you don't have admin privileges.
                          </p>
                          <button
                            onClick={fetchUsers}
                            className="flex items-center gap-2 text-primary hover:text-primary/70 text-sm"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : isUsersEmpty || users.length === 0 ? (
                    // Empty State - Show fallback UI with helpful message
                    <tr>
                      <td colSpan={5} className="px-5 py-8">
                        <div className="flex flex-col items-center gap-3">
                          <Users className="h-8 w-8 text-muted-foreground" />
                          <div className="text-center">
                            <p className="text-muted-foreground font-medium">No users found</p>
                            <p className="text-muted-foreground text-sm mt-1">
                              The users collection appears to be empty. This is expected for first-time setup.
                            </p>
                          </div>
                          <button
                            onClick={fetchUsers}
                            className="flex items-center gap-2 text-primary hover:text-primary/70 text-sm mt-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.uid} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-4 text-foreground">{u.email}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                            u.role === "admin" 
                              ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          }`}>
                            {u.role === "admin" ? <><Shield className="h-3 w-3 inline mr-1" />Admin</> : <><ShieldOff className="h-3 w-3 inline mr-1" />Content Manager</>}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-foreground">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}</td>
                        <td className="px-5 py-4 text-foreground">
                          {u.lastSignIn && u.lastSignIn !== "" 
                            ? new Date(u.lastSignIn).toLocaleDateString() 
                            : "Never"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            {u.role !== "admin" && (
                              <button
                                onClick={() => handleDeleteUser(u.uid, u.role)}
                                className="text-destructive hover:text-destructive/70 transition-colors"
                                aria-label="Delete"
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
        )}

        {/* Create User Modal - Uses Secondary Firebase App to prevent admin logout */}
        <CreateUserModal
          isOpen={showCreateUserPopup}
          onClose={() => setShowCreateUserPopup(false)}
          onSuccess={fetchUsers}
        />
      </div>
    </div>
  );
};

export default Admin;
