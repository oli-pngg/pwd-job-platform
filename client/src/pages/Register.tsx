import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Moon, Sun, Eye, EyeOff, UserPlus, AlertCircle,
  Briefcase, User, ChevronRight, ChevronLeft, X, Plus,
} from "lucide-react";

const DISABILITY_TYPES = [
  { value: "visual", label: "Visual Disability", desc: "Blind or low vision" },
  { value: "hearing", label: "Hearing Disability", desc: "Deaf or hard of hearing" },
  { value: "speech", label: "Speech Disability", desc: "Speech impairment" },
];

const WORK_PREFERENCES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "freelance", label: "Freelance" },
];

const SUGGESTED_SKILLS = [
  "Data Entry", "MS Office", "Typing", "Communication", "Customer Service",
  "Computer Literacy", "Graphic Design", "Problem Solving", "Spreadsheets",
  "Writing", "Email", "Internet Browsing", "Accuracy", "Research",
];

export default function Register() {
  const [, setHash] = [null, null]; // placeholder
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"pwd_seeker" | "employer" | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    city: "Legazpi City",
    phone: "",
    bio: "",
    // Seeker fields
    disabilityType: "",
    skills: [] as string[],
    workPreference: "",
    // Employer fields
    company: "",
  });

  const updateForm = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !form.skills.includes(trimmed)) {
      updateForm("skills", [...form.skills, trimmed]);
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    updateForm("skills", form.skills.filter((s) => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const registerData: any = {
        ...form,
        role,
        disabilityType: role === "pwd_seeker" ? form.disabilityType || undefined : undefined,
        skills: role === "pwd_seeker" ? form.skills : [],
        workPreference: role === "pwd_seeker" ? form.workPreference || undefined : undefined,
        company: role === "employer" ? form.company : undefined,
      };
      const user = await register(registerData);
      if (user.role === "employer") {
        window.location.hash = "/employer/dashboard";
      } else {
        window.location.hash = "/seeker/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep1 = role !== "";
  const canProceedStep2 = form.name && form.email && form.password.length >= 6;
  const canSubmit =
    canProceedStep2 &&
    (role === "employer" ? !!form.company : !!form.disabilityType);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <a
        href="#register-form"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm"
      >
        Skip to registration form
      </a>

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

      <main id="main-content" role="main" className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-4" aria-hidden="true">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <h1
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
            >
              Create Account
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Join the inclusive employment platform
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-8" aria-label="Registration steps">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    s === step
                      ? "bg-primary text-primary-foreground"
                      : s < step
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                  aria-label={`Step ${s}${s === step ? " (current)" : s < step ? " (completed)" : ""}`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-8 h-0.5 ${s < step ? "bg-primary" : "bg-muted"}`}
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm" id="register-form">
            {error && (
              <Alert variant="destructive" className="mb-6" role="alert" aria-live="assertive">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Role Selection */}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">I am registering as a...</h2>
                <p className="text-sm text-muted-foreground mb-6">Choose your account type to get started.</p>

                <div className="space-y-3" role="radiogroup" aria-label="Account type selection">
                  {[
                    {
                      value: "pwd_seeker",
                      icon: <User size={24} />,
                      label: "PWD Job Seeker",
                      desc: "I am a person with disability looking for employment opportunities.",
                    },
                    {
                      value: "employer",
                      icon: <Briefcase size={24} />,
                      label: "Employer",
                      desc: "I represent a company looking to hire talented PWD professionals.",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value as any)}
                      role="radio"
                      aria-checked={role === opt.value}
                      data-testid={`button-role-${opt.value}`}
                      className={`w-full flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                        role === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/30"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${role === opt.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                        aria-hidden="true"
                      >
                        {opt.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{opt.label}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <Button
                  className="w-full mt-6 gap-2"
                  disabled={!canProceedStep1}
                  onClick={() => setStep(2)}
                  data-testid="button-next-step1"
                >
                  Continue <ChevronRight size={16} />
                </Button>
              </div>
            )}

            {/* Step 2: Basic Info */}
            {step === 2 && (
              <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} noValidate>
                <h2 className="text-lg font-semibold text-foreground mb-6">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name <span aria-hidden="true" className="text-destructive">*</span></Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => updateForm("name", e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-1.5"
                      required
                      aria-required="true"
                      data-testid="input-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reg-email">Email Address <span aria-hidden="true" className="text-destructive">*</span></Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                      placeholder="your@email.com"
                      className="mt-1.5"
                      required
                      aria-required="true"
                      data-testid="input-email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reg-password">Password <span aria-hidden="true" className="text-destructive">*</span></Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => updateForm("password", e.target.value)}
                        placeholder="At least 6 characters"
                        className="pr-10"
                        required
                        minLength={6}
                        aria-required="true"
                        aria-describedby="password-hint"
                        data-testid="input-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p id="password-hint" className="text-xs text-muted-foreground mt-1">Minimum 6 characters</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={form.city}
                        onChange={(e) => updateForm("city", e.target.value)}
                        placeholder="Legazpi City"
                        className="mt-1.5"
                        data-testid="input-city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => updateForm("phone", e.target.value)}
                        placeholder="09XX XXX XXXX"
                        className="mt-1.5"
                        data-testid="input-phone"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="gap-2"
                    data-testid="button-prev-step2"
                  >
                    <ChevronLeft size={16} /> Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 gap-2"
                    disabled={!canProceedStep2}
                    data-testid="button-next-step2"
                  >
                    Continue <ChevronRight size={16} />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3: Role-specific details */}
            {step === 3 && (
              <form onSubmit={handleSubmit} noValidate>
                <h2 className="text-lg font-semibold text-foreground mb-6">
                  {role === "employer" ? "Company Information" : "Your Disability & Skills"}
                </h2>

                {role === "pwd_seeker" && (
                  <div className="space-y-5">
                    <div>
                      <Label className="text-sm font-medium">
                        Disability Type <span aria-hidden="true" className="text-destructive">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2">This is used for accessibility purposes only and is NOT shown to employers during initial matching.</p>
                      <div className="grid gap-2 mt-2" role="radiogroup" aria-label="Disability type selection">
                        {DISABILITY_TYPES.map((dt) => (
                          <button
                            key={dt.value}
                            type="button"
                            onClick={() => updateForm("disabilityType", dt.value)}
                            role="radio"
                            aria-checked={form.disabilityType === dt.value}
                            data-testid={`button-disability-${dt.value}`}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                              form.disabilityType === dt.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                              form.disabilityType === dt.value ? "border-primary" : "border-muted-foreground"
                            }`}>
                              {form.disabilityType === dt.value && (
                                <div className="w-2 h-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{dt.label}</p>
                              <p className="text-xs text-muted-foreground">{dt.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Work Preference</Label>
                      <div className="flex flex-wrap gap-2 mt-2" role="group" aria-label="Work preference selection">
                        {WORK_PREFERENCES.map((wp) => (
                          <button
                            key={wp.value}
                            type="button"
                            onClick={() => updateForm("workPreference", wp.value)}
                            aria-pressed={form.workPreference === wp.value}
                            data-testid={`button-work-preference-${wp.value}`}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                              form.workPreference === wp.value
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border hover:border-primary/40 text-foreground"
                            }`}
                          >
                            {wp.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Your Skills</Label>
                      <p className="text-xs text-muted-foreground mb-2">Add skills that describe what you can do best.</p>
                      
                      {/* Suggested skills */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {SUGGESTED_SKILLS.filter((s) => !form.skills.includes(s)).slice(0, 8).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => addSkill(s)}
                            className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 transition-all"
                            aria-label={`Add skill: ${s}`}
                            data-testid={`button-add-suggested-skill-${s.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            + {s}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }}
                          placeholder="Type a skill and press Enter"
                          className="flex-1"
                          aria-label="Add custom skill"
                          data-testid="input-skill"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addSkill(skillInput)}
                          disabled={!skillInput.trim()}
                          data-testid="button-add-skill"
                        >
                          <Plus size={16} />
                        </Button>
                      </div>

                      {form.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3" aria-label="Selected skills">
                          {form.skills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="gap-1 pr-1 bg-primary/10 text-primary border-0"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => removeSkill(skill)}
                                className="ml-0.5 rounded-full hover:bg-primary/20 p-0.5"
                                aria-label={`Remove skill: ${skill}`}
                                data-testid={`button-remove-skill-${skill.toLowerCase().replace(/\s+/g, "-")}`}
                              >
                                <X size={10} />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="bio">Brief Bio (optional)</Label>
                      <textarea
                        id="bio"
                        value={form.bio}
                        onChange={(e) => updateForm("bio", e.target.value)}
                        placeholder="Tell employers a bit about yourself..."
                        rows={3}
                        className="w-full mt-1.5 px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        data-testid="input-bio"
                      />
                    </div>
                  </div>
                )}

                {role === "employer" && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="company">
                        Company Name <span aria-hidden="true" className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="company"
                        value={form.company}
                        onChange={(e) => updateForm("company", e.target.value)}
                        placeholder="e.g., Bicol BPO Solutions"
                        className="mt-1.5"
                        required
                        aria-required="true"
                        data-testid="input-company"
                      />
                    </div>
                    <div>
                      <Label htmlFor="employer-bio">Company Description (optional)</Label>
                      <textarea
                        id="employer-bio"
                        value={form.bio}
                        onChange={(e) => updateForm("bio", e.target.value)}
                        placeholder="Tell job seekers about your company..."
                        rows={3}
                        className="w-full mt-1.5 px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        data-testid="input-company-bio"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="gap-2"
                    data-testid="button-prev-step3"
                  >
                    <ChevronLeft size={16} /> Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 gap-2"
                    disabled={loading || !canSubmit}
                    data-testid="button-submit-register"
                    aria-label="Create your account"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" aria-hidden="true" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} aria-hidden="true" /> Create Account
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
                data-testid="link-login"
              >
                Log in here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
