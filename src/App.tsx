import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ScrollToTop } from "./components/effects/ScrollToTop";
import { ChatWidget } from "./components/chat/ChatWidget";

// Public Pages
import Index from "./pages/Index";
import About from "./pages/About";
import Services from "./pages/Services";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Customer Portal
import PortalDashboard from "./pages/portal/Dashboard";
import PortalVehicles from "./pages/portal/Vehicles";
import PortalBook from "./pages/portal/Book";
import PortalAppointments from "./pages/portal/Appointments";
import PortalTrack from "./pages/portal/Track";
import PortalProfile from "./pages/portal/Profile";

// Admin Dashboard
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminAppointments from "./pages/admin/Appointments";
import AdminCustomers from "./pages/admin/Customers";
import AdminBilling from "./pages/admin/Billing";
import AdminReminders from "./pages/admin/Reminders";
import AdminLocations from "./pages/admin/Locations";
import AdminReports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Separate component that uses router hooks (must be inside BrowserRouter)
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Website */}
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/contact" element={<Contact />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Customer Portal */}
        <Route path="/portal" element={<PortalDashboard />} />
        <Route path="/portal/vehicles" element={<PortalVehicles />} />
        <Route path="/portal/book" element={<PortalBook />} />
        <Route path="/portal/appointments" element={<PortalAppointments />} />
        <Route path="/portal/track/:id" element={<PortalTrack />} />
        <Route path="/portal/profile" element={<PortalProfile />} />

        {/* Admin Dashboard */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/appointments" element={<AdminAppointments />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/admin/billing" element={<AdminBilling />} />
        <Route path="/admin/reminders" element={<AdminReminders />} />
        <Route path="/admin/locations" element={<AdminLocations />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/settings" element={<AdminSettings />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AnimatedRoutes />
        <ChatWidget />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
