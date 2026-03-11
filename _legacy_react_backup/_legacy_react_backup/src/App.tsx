import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy load route components for code splitting
const FloorOne = lazy(() => import("./pages/FloorOne"));
const FloorTwo = lazy(() => import("./pages/FloorTwo"));
const FloorThree = lazy(() => import("./pages/FloorThree"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component for Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
  </div>
);

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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Navigate to="/floor2" replace />} />
                <Route path="/floor2" element={<FloorOne />} />
                <Route path="/floor3" element={<FloorTwo />} />
                <Route path="/floor4" element={<FloorThree />} />
                <Route path="/admin" element={<Admin />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
