import { useState, useMemo, useEffect } from "react";
import { db, MENU_ITEMS_COLLECTION } from "@/lib/firebase-new";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";

const LEVELS = ["Level 1", "Level 2", "Level 3"];
const CATEGORIES = ["Main Course", "Dessert", "Beverage", "Snacks"];

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  canteen_level: string;
  created_at: string;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  "Main Course": "category-gradient-main",
  Dessert: "category-gradient-dessert",
  Beverage: "category-gradient-beverage",
  Snacks: "category-gradient-snacks",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  "Main Course": "🍜",
  Dessert: "🥮",
  Beverage: "🍵",
  Snacks: "🥟",
};

const isTVMode = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('view') === 'tv';
};

const Index = () => {
  const [selectedLevel, setSelectedLevel] = useState<string>(() => {
    // On mount, read from localStorage, default to "Level 1"
    const saved = localStorage.getItem("canteen_currentLevel");
    return saved && LEVELS.includes(saved) ? saved : "Level 1";
  });
  const [isTV, setIsTV] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Handle level change with localStorage persistence
  const handleLevelChange = (level: string) => {
    setSelectedLevel(level);
    localStorage.setItem("canteen_currentLevel", level);
  };

  useEffect(() => {
    setIsTV(isTVMode());
    
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Use onSnapshot for real-time updates (sync with Admin.tsx CMS)
  useEffect(() => {
    setIsLoading(true);
    setIsError(false);

    const q = query(
      collection(db, MENU_ITEMS_COLLECTION),
      where("canteen_level", "==", selectedLevel),
      orderBy("category"),
      orderBy("name")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const itemsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as MenuItem[];
        setItems(itemsData);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching items:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch items"));
        setIsError(true);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedLevel]);

  // Memoize menuByCategory to avoid recalculating on every render
  const menuByCategory = useMemo(() => {
    return CATEGORIES.reduce<Record<string, MenuItem[]>>(
      (acc, cat) => {
        acc[cat] = items.filter((item) => item.category === cat);
        return acc;
      },
      {}
    );
  }, [items]);

  // Handle error state
  if (isError) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="bg-primary border-b-4 border-accent">
          <div className="container mx-auto px-6 py-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-lantern-sway inline-block origin-top">🏮</span>
              <span className="font-display text-2xl font-bold text-primary-foreground tracking-wide">
                Campus Canteen
              </span>
            </div>
            <Link
              to="/admin"
              className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors border border-primary-foreground/30 px-3 py-1 rounded"
            >
              Admin Login
            </Link>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-6 py-10">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-semibold mb-2">Failed to load menu</p>
            <p className="text-red-500 text-sm mb-4">{error instanceof Error ? error.message : 'Unknown error'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen ${isTV ? 'tv-mode' : ''}`}>
      {/* Offline indicator */}
      {isOffline && (
        <div className="bg-yellow-500 text-yellow-900 text-center py-1 text-sm font-medium">
          📡 You are offline. Showing saved menu data.
        </div>
      )}
      
      {/* Header */}
      <header className="bg-primary border-b-4 border-accent">
        <div className="container mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-lantern-sway inline-block origin-top">🏮</span>
            <span className="font-display text-2xl font-bold text-primary-foreground tracking-wide">
              Campus Canteen
            </span>
          </div>
          <Link
            to="/admin"
            className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors border border-primary-foreground/30 px-3 py-1 rounded"
          >
            Admin Login
          </Link>
        </div>
      </header>

      {/* Decorative banner */}
      <div className="bg-primary/95 text-center py-2 border-b border-accent/30">
        <p className="text-primary-foreground/80 text-xs tracking-[0.3em] uppercase font-display">
          ✦ 美食天地 · Delicious Food Paradise ✦
        </p>
      </div>

      {/* Level Selection */}
      <div className="bg-card border-b-2 border-accent/20">
        <div className="container mx-auto px-6 py-5">
          <h2 className="text-muted-foreground text-xs font-bold uppercase mb-3 tracking-widest font-display">
            选择楼层 · Select Level
          </h2>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
onClick={() => handleLevelChange(lvl)}
                className={`px-6 py-2.5 rounded text-sm font-semibold transition-all duration-300 border-2 ${
                  selectedLevel === lvl
                    ? "bg-primary text-primary-foreground border-primary lantern-shadow"
                    : "border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu */}
      <main className="flex-1 container mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <h3 className="font-display text-3xl font-bold text-foreground mb-2">
            {selectedLevel} · 菜单
          </h3>
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-16 bg-accent/50" />
            <span className="text-accent text-lg">🍜</span>
            <span className="h-px w-16 bg-accent/50" />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="bg-card rounded-lg overflow-hidden animate-pulse border-2 border-border">
                <div className="h-16 bg-muted" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CATEGORIES.map((category) => (
              <div
                key={category}
                className="bg-card rounded-lg overflow-hidden lantern-shadow hover:scale-[1.02] transition-transform duration-300 border-2 border-accent/20"
              >
                <div className={`${CATEGORY_GRADIENTS[category]} p-4 relative`}>
                  <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')]" />
                  <h4 className="text-primary-foreground font-display font-bold text-lg text-center uppercase tracking-wider flex items-center justify-center gap-2 relative z-10">
                    <span className="text-2xl">{CATEGORY_EMOJIS[category]}</span>
                    {category}
                  </h4>
                </div>
                <div className="p-5">
                  {menuByCategory[category]?.length === 0 ? (
                    <p className="text-muted-foreground text-center italic text-sm py-4">
                      暂无菜品 · No items today
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {menuByCategory[category]?.map((item) => (
                        <li
                          key={item.id}
                          className="flex justify-between items-start border-b border-border/60 pb-2 last:border-0 last:pb-0"
                        >
                          <span className="text-foreground font-medium text-sm">
                            {item.name}
                          </span>
                          <span className="text-primary font-bold text-sm ml-2 whitespace-nowrap">
                            RM {Number(item.price).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-primary mt-auto border-t-4 border-accent">
        <div className="container mx-auto px-6 py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🏮</span>
            <span className="font-display text-primary-foreground font-bold">Campus Canteen</span>
            <span className="text-2xl">🏮</span>
          </div>
          <p className="text-primary-foreground/60 text-xs">
            © {new Date().getFullYear()} Campus Canteen · 校园食堂 · All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
