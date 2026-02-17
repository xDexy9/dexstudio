import { Suspense, lazy } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";

// Guard for routes that don't use AppLayout
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

// Eagerly loaded (critical path)
import AuthPage from "@/pages/AuthPage";

// Lazy loaded pages (code-split)
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const JobsPage = lazy(() => import("@/pages/JobsPage"));
const CreateJobPage = lazy(() => import("@/pages/CreateJobPage"));
const JobDetailPage = lazy(() => import("@/pages/JobDetailPage"));
const JobMessagesPage = lazy(() => import("@/pages/JobMessagesPage"));
const MessagesPage = lazy(() => import("@/pages/MessagesPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const VehicleHistoryPage = lazy(() => import("@/pages/VehicleHistoryPage"));
const ManagerDashboardPage = lazy(() => import("@/pages/ManagerDashboardPage"));
const AnalyticsPage = lazy(() => import("@/pages/manager/AnalyticsPage"));
const TeamPage = lazy(() => import("@/pages/manager/TeamPage"));
const VehiclesPage = lazy(() => import("@/pages/manager/VehiclesPage"));
const CustomersPage = lazy(() => import("@/pages/manager/CustomersPage"));
const PartsManagementPage = lazy(() => import("@/pages/manager/PartsManagementPage").then(m => ({ default: m.PartsManagementPage })));
const ServicesManagementPage = lazy(() => import("@/pages/manager/ServicesManagementPage").then(m => ({ default: m.ServicesManagementPage })));
const CompanySettingsPage = lazy(() => import("@/pages/manager/CompanySettingsPage").then(m => ({ default: m.CompanySettingsPage })));
const QuotesPage = lazy(() => import("@/pages/manager/QuotesPage").then(m => ({ default: m.QuotesPage })));
const InvoicesPage = lazy(() => import("@/pages/manager/InvoicesPage").then(m => ({ default: m.InvoicesPage })));
const PartsOrderingPage = lazy(() => import("@/pages/manager/PartsOrderingPage"));
const DataManagementPage = lazy(() => import("@/pages/manager/DataManagementPage"));
const DocumentDetailPage = lazy(() => import("@/pages/DocumentDetailPage"));
const QuoteApprovalPage = lazy(() => import("@/pages/public/QuoteApprovalPage").then(m => ({ default: m.QuoteApprovalPage })));
const OfficeStaffHomePage = lazy(() => import("@/pages/OfficeStaffHomePage"));
const GenerateMockDataPage = lazy(() => import("@/pages/GenerateMockDataPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <HashRouter>
          <AuthProvider>
            <OfflineProvider>
              <LanguageProvider>
                <NotificationProvider>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                  {/* Public routes */}
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/quote/approve/:token" element={<QuoteApprovalPage />} />

                  {/* Office staff routes (no AppLayout) */}
                  <Route path="/office" element={
                    <ProtectedRoute><OfficeStaffHomePage /></ProtectedRoute>
                  } />
                  <Route path="/office/settings" element={
                    <ProtectedRoute><SettingsPage /></ProtectedRoute>
                  } />

                  {/* Protected routes */}
                  <Route path="/dashboard" element={
                    <AppLayout><DashboardPage /></AppLayout>
                  } />
                  <Route path="/manager" element={
                    <AppLayout><ManagerDashboardPage /></AppLayout>
                  } />
                  <Route path="/manager/analytics" element={
                    <AppLayout><AnalyticsPage /></AppLayout>
                  } />
                  <Route path="/team" element={
                    <AppLayout><TeamPage /></AppLayout>
                  } />
                  <Route path="/vehicles" element={
                    <AppLayout><VehiclesPage /></AppLayout>
                  } />
                  <Route path="/customers" element={
                    <AppLayout><CustomersPage /></AppLayout>
                  } />
                  <Route path="/parts" element={
                    <AppLayout><PartsManagementPage /></AppLayout>
                  } />
                  <Route path="/parts-orders" element={
                    <AppLayout><PartsOrderingPage /></AppLayout>
                  } />
                  <Route path="/services" element={
                    <AppLayout><ServicesManagementPage /></AppLayout>
                  } />
                  <Route path="/company-settings" element={
                    <AppLayout><CompanySettingsPage /></AppLayout>
                  } />
                  <Route path="/data-management" element={
                    <AppLayout><DataManagementPage /></AppLayout>
                  } />
                  <Route path="/quotes" element={
                    <AppLayout><QuotesPage /></AppLayout>
                  } />
                  <Route path="/quotes/:quoteId" element={
                    <AppLayout><DocumentDetailPage /></AppLayout>
                  } />
                  <Route path="/invoices" element={
                    <AppLayout><InvoicesPage /></AppLayout>
                  } />
                  <Route path="/invoices/:invoiceId" element={
                    <AppLayout><DocumentDetailPage /></AppLayout>
                  } />
                  <Route path="/jobs" element={
                    <AppLayout><JobsPage /></AppLayout>
                  } />
                  <Route path="/jobs/new" element={
                    <ProtectedRoute><CreateJobPage /></ProtectedRoute>
                  } />
                  <Route path="/jobs/:jobId" element={
                    <AppLayout><JobDetailPage /></AppLayout>
                  } />
                  <Route path="/jobs/:jobId/messages" element={
                    <ProtectedRoute><JobMessagesPage /></ProtectedRoute>
                  } />
                  <Route path="/vehicles/:vehicleId/history" element={
                    <AppLayout><VehicleHistoryPage /></AppLayout>
                  } />
                  <Route path="/messages" element={
                    <AppLayout><MessagesPage /></AppLayout>
                  } />
                  <Route path="/settings" element={
                    <AppLayout><SettingsPage /></AppLayout>
                  } />
                  <Route path="/generate-mock-data" element={
                    <ProtectedRoute><GenerateMockDataPage /></ProtectedRoute>
                  } />

                  {/* Redirects */}
                  <Route path="/" element={<Navigate to="/auth" replace />} />

                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                  </Routes>
                  </Suspense>
                </NotificationProvider>
              </LanguageProvider>
            </OfflineProvider>
          </AuthProvider>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
