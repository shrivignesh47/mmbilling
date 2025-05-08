
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth";

// Layouts
import OwnerLayout from "@/layouts/OwnerLayout";
import ManagerLayout from "@/layouts/ManagerLayout";
import CashierLayout from "@/layouts/CashierLayout";

// Pages
import Login from "@/pages/auth/Login";
import ShopLogin from "@/pages/auth/ShopLogin";
import NotFound from "@/pages/NotFound";

// Owner Pages
import OwnerDashboard from "@/pages/dashboards/owner/OwnerDashboard";
import Shops from "@/pages/owner/Shops";
import Users from "@/pages/owner/Users";
import Roles from "@/pages/owner/Roles";
import Notifications from "@/pages/owner/Notifications";
import Settings from "@/pages/owner/Settings";

// Manager Pages
import ManagerDashboard from "@/pages/dashboards/manager/ManagerDashboard";
import Inventory from "@/pages/manager/Inventory";
import Products from "@/pages/manager/Products";
import UserManagement from "@/pages/manager/UserManagement";
import StaffNotifications from "@/pages/manager/StaffNotifications";
import ManagerSettings from "@/pages/manager/Settings";

// Cashier Pages
import CashierDashboard from "@/pages/dashboards/cashier/CashierDashboard";
import Billing from "@/pages/cashier/Billing";
import CashierSettings from "@/pages/cashier/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/shop/:shopSlug" element={<ShopLogin />} />
            <Route index element={<Navigate to="/login" />} />

            {/* Owner Routes */}
            <Route path="/owner" element={<OwnerLayout />}>
              <Route path="dashboard" element={<OwnerDashboard />} />
              <Route path="shops" element={<Shops />} />
              <Route path="users" element={<Users />} />
              <Route path="roles" element={<Roles />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<Settings />} />
              <Route index element={<Navigate to="/owner/dashboard" />} />
            </Route>

            {/* Manager Routes */}
            <Route path="/manager" element={<ManagerLayout />}>
              <Route path="dashboard" element={<ManagerDashboard />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="products" element={<Products />} />
              <Route path="staff" element={<UserManagement />} />
              <Route path="notifications" element={<StaffNotifications />} />
              <Route path="settings" element={<ManagerSettings />} />
              <Route index element={<Navigate to="/manager/dashboard" />} />
            </Route>

            {/* Cashier Routes */}
            <Route path="/cashier" element={<CashierLayout />}>
              <Route path="dashboard" element={<CashierDashboard />} />
              <Route path="billing" element={<Billing />} />
              <Route path="settings" element={<CashierSettings />} />
              <Route index element={<Navigate to="/cashier/dashboard" />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
