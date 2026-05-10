import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Eye,
  Ear,
  MessageSquare,
  Target,
  Shield,
  Users,
  Briefcase,
  CheckCircle,
  Moon,
  Sun,
  ArrowRight,
  Star,
  BarChart3,
  Award,
} from "lucide-react";

const features = [
  {
    icon: <Target className="w-6 h-6" />,
    title: "Skill-Based Matching",
    description:
      "Our algorithm matches you based solely on your skills and abilities — not your disability. Fair, objective, and effective.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Blind Matching",
    description:
      "Initial job matching hides disability information from employers, ensuring you're evaluated purely on your capabilities.",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: "Skill Assessments",
    description:
      "Complete verified skill assessments in computer literacy, communication, data entry, and problem solving to boost your profile.",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Fit Score Analysis",
    description:
      "Every job match includes a detailed Fit Score showing how your skills align with job requirements.",
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Employer Network",
    description:
      "Connect with disability-friendly employers in Legazpi City who are committed to inclusive hiring practices.",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    icon: <Briefcase className="w-6 h-6" />,
    title: "Multiple Work Types",
    description:
      "Find full-time, part-time, and freelance opportunities that match your work preferences and availability.",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
];

const disabilities = [
  { type: "Visual", icon: <Eye className="w-8 h-8" />, desc: "Blind or low vision — screen reader optimized" },
  { type: "Hearing", icon: <Ear className="w-8 h-8" />, desc: "Deaf or hard of hearing — visual-first interface" },
  { type: "Speech", icon: <MessageSquare className="w-8 h-8" />, desc: "Speech impairments — text-based interaction" },
];

const stats = [
  { value: "", label: "Skill-based matching" },
  { value: "WCAG 2.1", label: "Accessibility standard" },
  { value: "3+", label: "Disability types supported" },
  { value: "", label: "Skill assessment categories" },
];

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <header role="banner" className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <nav
          role="navigation"
          aria-label="Main navigation"
          className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16"
        >
          <Logo size={32} showText={true} />

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              data-testid="button-toggle-theme"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {user ? (
              <Button asChild size="sm" className="gap-2">
                <Link
                  href={user.role === "employer" ? "/employer/dashboard" : "/seeker/dashboard"}
                  data-testid="link-go-to-dashboard"
                >
                  Dashboard <ArrowRight size={14} />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" data-testid="link-login">
                  <Link href="/login">Log In</Link>
                </Button>
                <Button asChild size="sm" data-testid="link-register">
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main id="main-content" role="main">
        {/* Hero Section */}
        <section
          className="relative overflow-hidden px-4 sm:px-6 py-20 md:py-28 hero-gradient"
          aria-labelledby="hero-heading"
        >
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl">
              <Badge className="mb-6 bg-primary/10 text-primary border-0 text-sm px-3 py-1 rounded-full font-medium">
              </Badge>

              <h1
                id="hero-heading"
                className="text-4xl sm:text-6xl font-bold text-foreground mb-6 leading-tight"
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
              >
                Find Jobs That Match
                <span className="text-primary block">Your True Potential</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-8 max-w-2xl leading-relaxed">
                A skill-based job pairing platform built for persons with visual, hearing, and speech
                disabilities.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-base px-8 gap-2" data-testid="button-get-started">
                  <Link href="/register">
                    Get Started <ArrowRight size={18} />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base px-8" data-testid="button-employer-signup">
                  <Link href="/register">I'm an Employer</Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-4" aria-label="Key platform statistics">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm text-muted-foreground">
                      <strong className="text-foreground font-semibold">{stat.value}</strong> {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Decorative background shape */}
          <div
            className="absolute right-0 top-0 w-1/2 h-full opacity-5 pointer-events-none"
            aria-hidden="true"
          >
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <circle cx="300" cy="200" r="200" fill="hsl(183 85% 28%)" />
              <circle cx="350" cy="100" r="100" fill="hsl(183 85% 40%)" />
            </svg>
          </div>
        </section>

        {/* Disability Types Section */}
        <section
          className="px-4 sm:px-6 py-16 bg-muted/30"
          aria-labelledby="accessibility-heading"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2
                id="accessibility-heading"
                className="text-2xl font-bold text-foreground mb-3"
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
              >
                Built for Every Ability
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our platform is designed from the ground up with accessibility in mind, supporting three major
                disability categories.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {disabilities.map((d) => (
                <div
                  key={d.type}
                  className="flex flex-col items-center text-center p-8 rounded-2xl bg-card border border-border/60 shadow-sm hover:shadow-md transition-shadow"
                  role="article"
                  aria-label={`${d.type} disability support`}
                >
                  <div className="p-4 rounded-full bg-primary/10 text-primary mb-4" aria-hidden="true">
                    {d.icon}
                  </div>
                  <h3 className="font-semibold text-foreground text-lg mb-2">{d.type} Disability</h3>
                  <p className="text-sm text-muted-foreground">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section
          className="px-4 sm:px-6 py-16"
          aria-labelledby="features-heading"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2
                id="features-heading"
                className="text-2xl font-bold text-foreground mb-3"
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
              >
                How It Works
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our platform uses a sophisticated skill-based matching algorithm to connect PWD job seekers
                with the right employment opportunities.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                  role="article"
                >
                  <div className={`inline-flex p-3 rounded-xl mb-4 ${f.color}`} aria-hidden="true">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to Get Started */}
        <section
          className="px-4 sm:px-6 py-16 bg-muted/30"
          aria-labelledby="steps-heading"
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2
                id="steps-heading"
                className="text-2xl font-bold text-foreground mb-3"
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
              >
                Get Matched in 3 Steps
              </h2>
              <p className="text-muted-foreground">Simple, accessible, and designed for you.</p>
            </div>

            <ol className="space-y-6" aria-label="Steps to get started">
              {[
                {
                  step: "1",
                  title: "Create Your Profile",
                  desc: "Register as a PWD Job Seeker. Add your skills, work preferences, and tell employers what you do best.",
                },
                {
                  step: "2",
                  title: "Take Skill Assessments",
                  desc: "Complete assessments in Computer Literacy, Communication, Data Entry, and Problem Solving to verify your abilities.",
                },
                {
                  step: "3",
                  title: "Get Matched Automatically",
                  desc: "Our algorithm instantly finds jobs that match your skills with a Fit Score — ranked by best match first.",
                },
              ].map((item) => (
                <li
                  key={item.step}
                  className="flex gap-5 items-start p-6 bg-card rounded-2xl border border-border/60"
                >
                  <span
                    className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold flex-shrink-0"
                    aria-label={`Step ${item.step}`}
                  >
                    {item.step}
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA Section */}
        <section
          className="px-4 sm:px-6 py-20 bg-primary text-primary-foreground"
          aria-labelledby="cta-heading"
        >
          <div className="max-w-3xl mx-auto text-center">
            <h2
              id="cta-heading"
              className="text-3xl font-bold mb-4"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
            >
              Ready to Find Your Next Opportunity?
            </h2>
            <p className="text-primary-foreground/80 mb-8 text-lg">
             
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="text-base px-8 gap-2"
                data-testid="button-cta-register"
              >
                <Link href="/register">
                  Register as Job Seeker <ArrowRight size={18} />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="text-base px-8 bg-white/10 hover:bg-white/20 border border-white/20"
                data-testid="button-cta-employer"
              >
                <Link href="/register">Post Jobs as Employer</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer role="contentinfo" className="border-t border-border bg-muted/20 px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <Logo size={24} showText={true} />
              <p className="text-xs text-muted-foreground mt-2">
                Accessible Web-Based Job Pairing Platform — Thesis Project by Oli, John Paul N. & Olidana, John Lawrence P.
              </p>
              <p className="text-xs text-muted-foreground">UST Legazpi, Rawis Legazpi City, Albay, Philippines</p>
            </div>
            <div className="text-center md:text-right">
              
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground justify-center md:justify-end">
                <Link href="/login" className="hover:text-primary transition-colors">Log In</Link>
                <Link href="/register" className="hover:text-primary transition-colors">Register</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
