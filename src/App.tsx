import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Buyers from "./pages/Buyers";
import Demands from "./pages/Demands";
import Offers from "./pages/Offers";
import KYCVerification from "./pages/KYCVerification";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/buyers" element={<Buyers />} />
          <Route path="/suppliers" element={<Buyers />} />
          <Route path="/companies" element={<Buyers />} />
          <Route path="/partners" element={<Buyers />} />
          <Route path="/kyc" element={<KYCVerification />} />
          <Route path="/demands" element={<Demands />} />
          <Route path="/offers" element={<Offers />} />
          {/* More routes will be added as needed */}
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
