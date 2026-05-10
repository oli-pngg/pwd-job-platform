import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  User,
  ClipboardList,
  Briefcase,
  PlusCircle,
  Users,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ChevronRight,
  BarChart3,
  Eye,
  Ear,
  MessageSquare,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const seekerNavItems: NavItem[] = [
  { label: "Dashboard", href: "/seeker/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "My Profile", href: "/seeker/profile", icon: <User size={18} /> },
  { label: "Skills Assessment", href: "/seeker/assessment", icon: <ClipboardList size={18} /> },
  { label: "Browse Jobs", href: "/seeker/jobs", icon: <Briefcase size={18} /> },
];

const employerNavItems: NavItem[] = [
  { label: "Dashboard", href: "/employer/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Post a Job", href: "/employer/post-job", icon: <PlusCircle size={18} /> },
];

const adminNavItems: NavItem[] = [
  { label: "Statistics", href: "/admin/stats", icon: <BarChart3 size={18} /> },
];

const disabilityIcons: Record<string, React.ReactNode> = {
  visual: <Eye size={12} />,
  hearing: <Ear size={12} />,
  speech: <MessageSquare size={12} />,
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems =
    user?.role === "employer"
      ? employerNavItems
      : user?.role === "admin"
      ? adminNavItems
      : seekerNavItems;

  const roleLabel =
    user?.role === "pwd_seeker"
      ? "PWD Job Seeker"
      : user?.role === "employer"
      ? "Employer"
      : "Administrator";

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col
          bg-[hsl(var(--sidebar))] border-r border-[hsl(var(--sidebar-border))]
          transition-transform duration-200 ease-in-out
          lg:static lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[hsl(var(--sidebar-border))]">
          <Link href="/" aria-label="Go to home page">
            <Logo size={28} showText={true} />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))]"
            aria-label="Close navigation menu"
            data-testid="button-close-sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Info */}
        <div className="px-4 py-3 border-b border-[hsl(var(--sidebar-border))]">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold"
              aria-hidden="true"
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[hsl(var(--sidebar-foreground))] truncate" data-testid="text-username">
                {user?.name}
              </p>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-primary/10 text-primary border-0">
                  {roleLabel}
                </Badge>
                {user?.disabilityType && (
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground" title={`${user.disabilityType} disability`}>
                    {disabilityIcons[user.disabilityType]}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-100
                  ${isActive
                    ? "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]"
                    : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} className="flex-shrink-0 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-3 py-3 border-t border-[hsl(var(--sidebar-border))] space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] transition-colors"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            data-testid="button-toggle-theme"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Log out of your account"
            data-testid="button-logout"
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header
          role="banner"
          className="sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-background/90 backdrop-blur-sm border-b border-border"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-md hover:bg-accent text-foreground"
              aria-label="Open navigation menu"
              data-testid="button-open-sidebar"
            >
              <Menu size={20} />
            </button>
            {title && (
              <h1 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                {title}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="hidden lg:flex p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              data-testid="button-toggle-theme-top"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" role="main" className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
