import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PlusCircle, X, Plus, CheckCircle2, AlertCircle, Briefcase } from "lucide-react";

const WORK_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "freelance", label: "Freelance" },
];

const COMMON_SKILLS = [
  "Data Entry", "MS Office", "Typing", "Communication", "Customer Service",
  "Computer Literacy", "Graphic Design", "Problem Solving", "Spreadsheets",
  "Writing", "Email", "Internet Browsing", "Accuracy", "Research",
  "Filing", "Bookkeeping", "Social Media", "Content Writing", "Analysis",
];

export default function PostJob() {
  const { user } = useAuth();

  const [skillInput, setSkillInput] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "Legazpi City",
    type: "full_time",
    salary: "",
    requiredSkills: [] as string[],
  });

  const updateForm = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !form.requiredSkills.includes(trimmed)) {
      updateForm("requiredSkills", [...form.requiredSkills, trimmed]);
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    updateForm("requiredSkills", form.requiredSkills.filter((s) => s !== skill));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/jobs", {
        employerId: user?.id,
        company: user?.company || user?.name,
        ...form,
        requiredSkills: form.requiredSkills,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to post job");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer", user?.id, "jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setSuccessMsg("Job posted successfully! Candidate matching is running.");
      setErrorMsg("");
      setTimeout(() => { window.location.hash = "/employer/dashboard"; }, 2000);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
    },
  });

  const canSubmit = form.title && form.description && form.requiredSkills.length > 0;

  return (
    <DashboardLayout title="Post a Job">
      <div className="max-w-2xl mx-auto">
        {successMsg && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20" role="status" aria-live="polite">
            <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
            <AlertDescription className="text-green-700 dark:text-green-400">{successMsg}</AlertDescription>
          </Alert>
        )}
        {errorMsg && (
          <Alert variant="destructive" className="mb-6" role="alert" aria-live="assertive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
          <p className="text-sm text-foreground flex items-center gap-2">
            <Briefcase size={15} className="text-primary flex-shrink-0" aria-hidden="true" />
            Posted jobs are automatically matched against all PWD seeker profiles using our skill-based algorithm.
          </p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
          noValidate
          aria-label="Post a job form"
          className="space-y-5"
        >
          <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Job Details</h2>

            <div>
              <Label htmlFor="job-title">
                Job Title <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Input
                id="job-title"
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="e.g., Data Entry Specialist"
                className="mt-1.5"
                required
                aria-required="true"
                data-testid="input-job-title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job-location">Location</Label>
                <Input
                  id="job-location"
                  value={form.location}
                  onChange={(e) => updateForm("location", e.target.value)}
                  placeholder="Legazpi City"
                  className="mt-1.5"
                  data-testid="input-job-location"
                />
              </div>
              <div>
                <Label htmlFor="job-salary">Salary (optional)</Label>
                <Input
                  id="job-salary"
                  value={form.salary}
                  onChange={(e) => updateForm("salary", e.target.value)}
                  placeholder="e.g., ₱15,000/month"
                  className="mt-1.5"
                  data-testid="input-job-salary"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Employment Type</Label>
              <div className="flex gap-2 mt-2" role="group" aria-label="Employment type">
                {WORK_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => updateForm("type", t.value)}
                    aria-pressed={form.type === t.value}
                    data-testid={`button-type-${t.value}`}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                      form.type === t.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary/40 text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="job-description">
                Job Description <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <textarea
                id="job-description"
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                rows={5}
                placeholder="Describe the role, responsibilities, work environment, and any accommodations available..."
                className="w-full mt-1.5 px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                required
                aria-required="true"
                data-testid="input-job-description"
              />
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-1">
              Required Skills <span aria-hidden="true" className="text-destructive">*</span>
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              These skills are compared against seeker profiles for matching. Add specific, relevant skills.
            </p>

            {/* Quick-add common skills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {COMMON_SKILLS.filter((s) => !form.requiredSkills.includes(s)).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSkill(s)}
                  className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 transition-all"
                  aria-label={`Add required skill: ${s}`}
                  data-testid={`button-add-skill-${s.toLowerCase().replace(/\s+/g, "-")}`}
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
                placeholder="Type a required skill and press Enter"
                className="flex-1"
                aria-label="Add required skill"
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

            {form.requiredSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5" aria-label="Required skills list">
                {form.requiredSkills.map((skill) => (
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
                      aria-label={`Remove required skill: ${skill}`}
                      data-testid={`button-remove-skill-${skill.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <X size={10} aria-hidden="true" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No skills added yet. Add at least one required skill.</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full gap-2"
            size="lg"
            disabled={mutation.isPending || !canSubmit}
            data-testid="button-submit-job"
            aria-label="Post job listing"
          >
            {mutation.isPending ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" aria-hidden="true" />
                Posting Job...
              </>
            ) : (
              <>
                <PlusCircle size={16} aria-hidden="true" /> Post Job
              </>
            )}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
