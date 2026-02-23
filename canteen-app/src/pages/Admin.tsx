import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, Navigate } from "react-router-dom";
import { Pencil, Trash2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";

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
  const { user, loading, isAdmin, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: CATEGORIES[0],
    canteen_level: LEVELS[0],
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin_menu_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("canteen_level")
        .order("category")
        .order("name");
      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: isAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsed = menuItemSchema.parse({
        name: form.name,
        price: parseFloat(form.price),
        category: form.category,
        canteen_level: form.canteen_level,
      });

      const payload = {
        name: parsed.name,
        price: parsed.price,
        category: parsed.category,
        canteen_level: parsed.canteen_level,
      };

      if (editItem) {
        const { error } = await supabase
          .from("menu_items")
          .update(payload)
          .eq("id", editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("menu_items").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editItem ? "Item updated!" : "Item added!");
      queryClient.invalidateQueries({ queryKey: ["admin_menu_items"] });
      resetForm();
    },
    onError: (err) => {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        toast.error("Failed to save item");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item deleted!");
      queryClient.invalidateQueries({ queryKey: ["admin_menu_items"] });
    },
    onError: () => toast.error("Failed to delete item"),
  });

  const resetForm = () => {
    setEditItem(null);
    setForm({ name: "", price: "", category: CATEGORIES[0], canteen_level: LEVELS[0] });
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
    saveMutation.mutate();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl">🔒</span>
          <h1 className="font-display text-xl font-bold text-foreground mt-4">Access Denied · 无权限</h1>
          <p className="text-muted-foreground mt-2 text-sm">You don't have admin privileges.</p>
          <div className="mt-4 flex gap-3 justify-center">
            <Link to="/" className="text-primary hover:underline text-sm">Back to Menu</Link>
            <button onClick={signOut} className="text-destructive hover:underline text-sm">Sign Out</button>
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
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors border border-primary-foreground/30 px-3 py-1 rounded"
            >
              View Live Site
            </Link>
            <button
              onClick={signOut}
              className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors border border-primary-foreground/30 px-3 py-1 rounded flex items-center gap-1"
            >
              <LogOut className="h-3 w-3" /> Sign Out
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
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Food Name · 菜名
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Price (RM) · 价格
              </label>
              <input
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
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Category · 类别
              </label>
              <select
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
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Canteen Level · 楼层
              </label>
              <select
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
                disabled={saveMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-5 rounded-lg transition-colors disabled:opacity-50"
              >
                {saveMutation.isPending ? "Saving..." : editItem ? "Update Item" : "Add Item"}
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
                              if (confirm("Are you sure?")) deleteMutation.mutate(item.id);
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