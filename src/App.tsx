
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Buyers from "./pages/Buyers";
import Suppliers from "./pages/Suppliers";
import Companies from "./pages/Companies";
import Partners from "./pages/Partners";
import Demands from "./pages/Demands";
import Offers from "./pages/Offers";
import KYCVerification from "./pages/KYCVerification";
import NotFound from "./pages/NotFound";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected routes */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/buyers" element={<Buyers />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/kyc" element={<KYCVerification />} />
          <Route path="/demands" element={<Demands />} />
          <Route path="/offers" element={<Offers />} />
          {/* More routes will be added as needed */}
        </Route>
        
        {/* Fallback routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
