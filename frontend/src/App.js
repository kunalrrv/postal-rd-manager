import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import CustomerLayout from "@/components/CustomerLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import CustomersPage from "@/pages/CustomersPage";
import CustomerDetailPage from "@/pages/CustomerDetailPage";
import PaymentsPage from "@/pages/PaymentsPage";
import CalculatorPage from "@/pages/CalculatorPage";
import ReportsPage from "@/pages/ReportsPage";
import CustomerAccountsPage from "@/pages/CustomerAccountsPage";
import CustomerDashboardPage from "@/pages/CustomerDashboardPage";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-postal-red" />
          <p className="text-sm text-slate-500 font-body">Loading...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/my-account" replace />;
  return children;
}

function CustomerRoute({ children }) {
  const { user, loading, isCustomer } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isCustomer) return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading, isCustomer } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={isCustomer ? "/my-account" : "/"} replace />;
  return children;
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            {/* Admin routes */}
            <Route path="/" element={<AdminRoute><Layout /></AdminRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/:id" element={<CustomerDetailPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="calculator" element={<CalculatorPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="customer-accounts" element={<CustomerAccountsPage />} />
            </Route>
            {/* Customer routes */}
            <Route path="/my-account" element={<CustomerRoute><CustomerLayout /></CustomerRoute>}>
              <Route index element={<CustomerDashboardPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
