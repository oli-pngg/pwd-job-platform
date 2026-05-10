import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Pages
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import SeekerDashboard from "@/pages/seeker/SeekerDashboard";
import SeekerProfile from "@/pages/seeker/SeekerProfile";
import SeekerAssessment from "@/pages/seeker/SeekerAssessment";
import SeekerJobs from "@/pages/seeker/SeekerJobs";
import EmployerDashboard from "@/pages/employer/EmployerDashboard";
import PostJob from "@/pages/employer/PostJob";
import Candidates from "@/pages/employer/Candidates";
import NotFound from "@/pages/not-found";

// Protected route wrapper
function ProtectedRoute({
  component: Component,
  requiredRole,
}: {
  component: React.ComponentType;
  requiredRole?: string;
}) {
  const { user } = useAuth();
  if (!user) {
    window.location.hash = "/login";
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    window.location.hash = "/";
    return null;
  }

  return <Component />;
}

function AppRouter() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Seeker routes */}
      <Route path="/seeker/dashboard">
        {() => <ProtectedRoute component={SeekerDashboard} requiredRole="pwd_seeker" />}
      </Route>
      <Route path="/seeker/profile">
        {() => <ProtectedRoute component={SeekerProfile} requiredRole="pwd_seeker" />}
      </Route>
      <Route path="/seeker/assessment">
        {() => <ProtectedRoute component={SeekerAssessment} requiredRole="pwd_seeker" />}
      </Route>
      <Route path="/seeker/jobs">
        {() => <ProtectedRoute component={SeekerJobs} requiredRole="pwd_seeker" />}
      </Route>

      {/* Employer routes */}
      <Route path="/employer/dashboard">
        {() => <ProtectedRoute component={EmployerDashboard} requiredRole="employer" />}
      </Route>
      <Route path="/employer/post-job">
        {() => <ProtectedRoute component={PostJob} requiredRole="employer" />}
      </Route>
      <Route path="/employer/candidates/:jobId">
        {() => <ProtectedRoute component={Candidates} requiredRole="employer" />}
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router hook={useHashLocation}>
              <AppRouter />
            </Router>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
