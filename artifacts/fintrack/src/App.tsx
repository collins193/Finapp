import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Dashboard from '@/pages/Dashboard';
import Crypto from '@/pages/Crypto';
import CryptoDetail from '@/pages/CryptoDetail';
import Payments from '@/pages/Payments';
import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import Members from '@/pages/Members';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import AdminUsers from '@/pages/admin/Users';
import ActivityLog from '@/pages/admin/ActivityLog';
import PaymentAddresses from '@/pages/admin/PaymentAddresses';
import { Route, Switch, Router as WouterRouter, Redirect, useLocation } from 'wouter';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({
  component: Component,
  adminOnly = false,
}: {
  component: React.ComponentType;
  adminOnly?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="h-8 w-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function Router() {
  const { user, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Root redirect */}
      <Route path="/">
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
            <div className="h-8 w-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
          </div>
        ) : user ? (
          <Redirect to="/dashboard" />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      {/* Protected routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/crypto/:coinId">
        <ProtectedRoute component={CryptoDetail} />
      </Route>
      <Route path="/crypto">
        <ProtectedRoute component={Crypto} />
      </Route>
      <Route path="/payments">
        <ProtectedRoute component={Payments} />
      </Route>
      <Route path="/projects">
        <ProtectedRoute component={Projects} />
      </Route>
      <Route path="/projects/:id">
        <ProtectedRoute component={ProjectDetail} />
      </Route>
      <Route path="/members">
        <ProtectedRoute component={Members} />
      </Route>

      {/* Admin-only routes */}
      <Route path="/admin">
        <ProtectedRoute component={AdminUsers} adminOnly />
      </Route>
      <Route path="/admin/activity">
        <ProtectedRoute component={ActivityLog} adminOnly />
      </Route>
      <Route path="/admin/payment-addresses">
        <ProtectedRoute component={PaymentAddresses} adminOnly />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster position="top-right" richColors />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
