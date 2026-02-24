import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { db, auth, MENU_ITEMS_COLLECTION } from "@/lib/firebase";
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
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { Link } from "react-router-dom";
import { Pencil, Trash2, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const CATEGORIES = ["Main Course", "Dessert", "Beverage", "Snacks"];
const LEVELS = ["Level 1", "Level 2", "Level 3"];

const menuItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  price: z.number().positive("Price must be positive"),
  category: z.string().min(1),
  canteen_level: z.string().min(1),
});

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  canteen_level: string;
  created_at: string;
};

const Admin = () => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: CATEGORIES[0],
    canteen_level: LEVELS[0],
  });

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load menu items only when authenticated
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    try {
      await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
      toast.success("Signed in successfully!");
      setAuthForm({ email: "", password: "" });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sign in";
      toast.error(errorMessage);
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

  // Show loading while checking auth state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show sign-in form if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card rounded-lg lantern-shadow p-8 border-2 border-accent/20 w-full max-w-md">
          <div className="text-center mb-6">
            <span className="text-4xl">🏮</span>
            <h1 className="text-2xl font-display font-bold text-foreground mt-2">
              Admin Login
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              管理面板登录
            </p>
          </div>
          <form onSubmit={handleSignIn} className="space-y-4">
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
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={authForm.password}
                onChange={(e) => setAuthForm(f => ({ ...f, password: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isSigningIn}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSigningIn && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSigningIn ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/" className="text-primary text-sm hover:underline">
              ← Back to Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
        {/* Form */}
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

        {/* Table */}
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

export default Admin;
