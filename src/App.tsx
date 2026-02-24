import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// Auto refresh at 3:00 AM local time
const useAutoRefresh = () => {
  useEffect(() => {
    const checkAndRefresh = () => {
      const now = new Date();
      const targetHour = 3;
      const targetMinute = 0;
      
      if (now.getHours() === targetHour && now.getMinutes() < 5) {
        queryClient.invalidateQueries();
        window.location.reload();
      }
    };

    // Check every minute
    const interval = setInterval(checkAndRefresh, 60000);
    
    // Also check on mount
    checkAndRefresh();

    return () => clearInterval(interval);
  }, []);
};

const App = () => {
  useAutoRefresh();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
