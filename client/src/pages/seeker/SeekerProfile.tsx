import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import {
  Save, Plus, X, CheckCircle2, AlertCircle, User, Eye, Ear, MessageSquare,
} from "lucide-react";

const DISABILITY_TYPES = [
  { value: "visual", label: "Visual Disability", icon: <Eye size={16} /> },
  { value: "hearing", label: "Hearing Disability", icon: <Ear size={16} /> },
  { value: "speech", label: "Speech Disability", icon: <MessageSquare size={16} /> },
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
  "Filing", "Bookkeeping", "Social Media Management", "Content Writing",
];

export default function SeekerProfile() {
  const { user, updateUser } = useAuth();
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [skillInput, setSkillInput] = useState("");

  const skills: string[] = user?.skills ? JSON.parse(user.skills) : [];

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    city: user?.city || "",
    bio: user?.bio || "",
    disabilityType: user?.disabilityType || "",
    workPreference: user?.workPreference || "",
    skills: skills,
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

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, {
        ...data,
        skills: data.skills,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }
      return res.json();
    },
    onSuccess: (updatedUser) => {
      updateUser({ ...updatedUser, skills: JSON.stringify(form.skills) });
      // Invalidate matches since skills changed
      queryClient.invalidateQueries({ queryKey: ["/api/matches/seeker", user?.id] });
      setSuccessMsg("Profile updated successfully!");
      setErrorMsg("");
      setTimeout(() => setSuccessMsg(""), 4000);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
      setSuccessMsg("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} noValidate aria-label="Profile update form">
          {successMsg && (
            <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20" role="status" aria-live="polite">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
              <AlertDescription className="text-green-700 dark:text-green-400">{successMsg}</AlertDescription>
            </Alert>
          )}
          {errorMsg && (
            <Alert variant="destructive" className="mb-6" role="alert" aria-live="assertive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <div className="bg-card border border-border/60 rounded-2xl p-6 mb-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold" aria-hidden="true">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-foreground">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
              <User size={14} aria-hidden="true" /> Basic Information
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profile-name">Full Name</Label>
                  <Input
                    id="profile-name"
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    className="mt-1.5"
                    data-testid="input-name"
                  />
                </div>
                <div>
                  <Label htmlFor="profile-phone">Phone Number</Label>
                  <Input
                    id="profile-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    placeholder="09XX XXX XXXX"
                    className="mt-1.5"
                    data-testid="input-phone"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="profile-city">City</Label>
                <Input
                  id="profile-city"
                  value={form.city}
                  onChange={(e) => updateForm("city", e.target.value)}
                  className="mt-1.5"
                  data-testid="input-city"
                />
              </div>

              <div>
                <Label htmlFor="profile-bio">Bio</Label>
                <textarea
                  id="profile-bio"
                  value={form.bio}
                  onChange={(e) => updateForm("bio", e.target.value)}
                  rows={3}
                  placeholder="Tell employers about yourself..."
                  className="w-full mt-1.5 px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  data-testid="input-bio"
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-6 mb-5">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
              Disability Information
            </h2>
            <p className="text-xs text-muted-foreground mb-4 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
              🔒 This information is kept private during blind matching. Employers only see your skills and fit score initially.
            </p>

            <div className="space-y-2" role="radiogroup" aria-label="Disability type">
              {DISABILITY_TYPES.map((dt) => (
                <button
                  key={dt.value}
                  type="button"
                  onClick={() => updateForm("disabilityType", dt.value)}
                  role="radio"
                  aria-checked={form.disabilityType === dt.value}
                  data-testid={`button-disability-${dt.value}`}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                    form.disabilityType === dt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className={`${form.disabilityType === dt.value ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true">
                    {dt.icon}
                  </span>
                  <span className="text-sm font-medium text-foreground">{dt.label}</span>
                  {form.disabilityType === dt.value && (
                    <CheckCircle2 size={14} className="ml-auto text-primary flex-shrink-0" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-6 mb-5">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
              Work Preference
            </h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Work preference selection">
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

          <div className="bg-card border border-border/60 rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-1">
              Your Skills
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Skills are used in the matching algorithm to find suitable jobs.
            </p>

            {/* Suggested */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {SUGGESTED_SKILLS.filter((s) => !form.skills.includes(s)).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSkill(s)}
                  className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 transition-all"
                  aria-label={`Add skill: ${s}`}
                  data-testid={`button-suggest-skill-${s.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  + {s}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mb-3">
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
                aria-label="Add skill"
              >
                <Plus size={16} aria-hidden="true" />
              </Button>
            </div>

            {form.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5" aria-label="Your skills">
                {form.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="gap-1 pr-1 bg-primary/10 text-primary border-0 text-xs"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-0.5 rounded-full hover:bg-primary/20 p-0.5"
                      aria-label={`Remove skill: ${skill}`}
                      data-testid={`button-remove-skill-${skill.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <X size={10} aria-hidden="true" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No skills added yet. Add skills above.</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={mutation.isPending}
            data-testid="button-save-profile"
            aria-label="Save profile changes"
          >
            {mutation.isPending ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" aria-hidden="true" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} aria-hidden="true" /> Save Profile
              </>
            )}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
