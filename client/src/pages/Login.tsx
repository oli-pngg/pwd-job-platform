import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Moon, Sun, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === "employer") {
        window.location.hash = "/employer/dashboard";
      } else if (user.role === "admin") {
        window.location.hash = "/admin/stats";
      } else {
        window.location.hash = "/seeker/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip link */}
      <a
        href="#login-form"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm"
      >
        Skip to login form
      </a>

      {/* Header */}
      <header role="banner" className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link href="/" aria-label="Go to home page">
          <Logo size={28} showText={true} />
        </Link>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          data-testid="button-toggle-theme"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </header>

      {/* Main */}
      <main id="main-content" role="main" className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-4" aria-hidden="true">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <h1
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
            >
              Welcome Back
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Log in to your PWDJobs account
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            {error && (
              <Alert variant="destructive" className="mb-6" role="alert" aria-live="assertive">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form
              id="login-form"
              onSubmit={handleSubmit}
              noValidate
              aria-label="Login form"
            >
              <div className="space-y-5">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-1.5"
                    required
                    aria-required="true"
                    aria-describedby={error ? "login-error" : undefined}
                    data-testid="input-email"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pr-10"
                      required
                      aria-required="true"
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={loading || !email || !password}
                  data-testid="button-login"
                  aria-label="Log in to your account"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" aria-hidden="true" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn size={16} aria-hidden="true" /> Log In
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border/60">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Demo Credentials</p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>PWD Seeker:</span>
                  <span className="font-mono text-foreground">juan.delacruiz@email.com</span>
                </div>
                <div className="flex justify-between">
                  <span>Employer:</span>
                  <span className="font-mono text-foreground">hr@bicolbpo.com</span>
                </div>
                <div className="flex justify-between">
                  <span>Password:</span>
                  <span className="font-mono text-foreground">password123</span>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-primary font-medium hover:underline focus:outline-none focus:underline"
                data-testid="link-register"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
