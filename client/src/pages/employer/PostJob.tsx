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
import {
  PlusCircle, X, Plus, CheckCircle2, AlertCircle,
  Briefcase, Brain, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";

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

const TIMER_OPTIONS = [
  { value: 300, label: "5 minutes" },
  { value: 600, label: "10 minutes" },
  { value: 900, label: "15 minutes" },
  { value: 1800, label: "30 minutes" },
];

interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number; // index of the correct option
}

export default function PostJob() {
  const { user } = useAuth();

  const [skillInput, setSkillInput] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Assessment section
  const [enableAssessment, setEnableAssessment] = useState(false);
  const [assessmentTimer, setAssessmentTimer] = useState(300);
  const [passingScore, setPassingScore] = useState(60);
  const [assessmentQuestions, setAssessmentQuestions] = useState<AssessmentQuestion[]>([]);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  // New question form
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", "", "", ""]);
  const [newCorrectIndex, setNewCorrectIndex] = useState<number | null>(null);
  const [optionError, setOptionError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "Legazpi City",
    type: "full_time",
    salary: "",
    requiredSkills: [] as string[],
  });

  const updateForm = (field: string, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

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

  // Assessment question helpers
  const updateOption = (index: number, value: string) => {
    const updated = [...newOptions];
    updated[index] = value;
    setNewOptions(updated);
  };

  const addAssessmentQuestion = () => {
    setOptionError("");
    if (!newQuestion.trim()) {
      setOptionError("Please enter a question.");
      return;
    }
    const filledOptions = newOptions.map((o) => o.trim()).filter(Boolean);
    if (filledOptions.length < 2) {
      setOptionError("Please provide at least 2 answer options.");
      return;
    }
    if (newCorrectIndex === null || !newOptions[newCorrectIndex]?.trim()) {
      setOptionError("Please select the correct answer.");
      return;
    }
    // Remap correctIndex to filtered options
    const filledWithIndex = newOptions
      .map((o, i) => ({ text: o.trim(), originalIndex: i }))
      .filter((o) => o.text !== "");
    const remappedCorrect = filledWithIndex.findIndex(
      (o) => o.originalIndex === newCorrectIndex
    );

    const newQ: AssessmentQuestion = {
      id: Date.now().toString(),
      question: newQuestion.trim(),
      options: filledWithIndex.map((o) => o.text),
      correctIndex: remappedCorrect,
    };
    setAssessmentQuestions((prev) => [...prev, newQ]);
    setNewQuestion("");
    setNewOptions(["", "", "", ""]);
    setNewCorrectIndex(null);
    setExpandedQuestion(null);
  };

  const removeAssessmentQuestion = (id: string) => {
    setAssessmentQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        employerId: user?.id,
        company: user?.company || user?.name,
        ...form,
        requiredSkills: form.requiredSkills,
      };
      if (enableAssessment && assessmentQuestions.length > 0) {
        payload.assessment = {
          timer: assessmentTimer,
          passingScore,
          questions: assessmentQuestions,
        };
      }
      const res = await apiRequest("POST", "/api/jobs", payload);
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

  const canSubmit =
    form.title &&
    form.description &&
    form.requiredSkills.length > 0 &&
    (!enableAssessment || assessmentQuestions.length >= 1);

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
          {/* ── Job Details ── */}
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

          {/* ── Required Skills ── */}
          <div className="bg-card border border-border/60 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-1">
              Required Skills <span aria-hidden="true" className="text-destructive">*</span>
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              These skills are compared against seeker profiles for matching.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {COMMON_SKILLS.filter((s) => !form.requiredSkills.includes(s)).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSkill(s)}
                  className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 transition-all"
                  aria-label={`Add required skill: ${s}`}
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
                aria-label="Add skill"
              >
                <Plus size={16} aria-hidden="true" />
              </Button>
            </div>
            {form.requiredSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5" aria-label="Required skills list">
                {form.requiredSkills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1 pr-1 bg-primary/10 text-primary border-0 text-xs">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-0.5 rounded-full hover:bg-primary/20 p-0.5"
                      aria-label={`Remove required skill: ${skill}`}
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

          {/* ── Skill Assessment (NEW) ── */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-5">
            {/* Toggle header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                  <Brain size={15} className="text-primary" aria-hidden="true" />
                  Skill Assessment
                  <span className="text-xs font-normal normal-case text-muted-foreground">(optional)</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Applicants take a scored quiz before applying. Only those who meet the passing score proceed.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enableAssessment}
                aria-label="Enable skill assessment quiz"
                onClick={() => setEnableAssessment((v) => !v)}
                data-testid="toggle-assessment"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                  enableAssessment ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    enableAssessment ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {enableAssessment && (
              <>
                {/* Timer & Passing Score */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assessment-timer" className="text-xs mb-1 block">Time Limit</Label>
                    <select
                      id="assessment-timer"
                      value={assessmentTimer}
                      onChange={(e) => setAssessmentTimer(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Assessment time limit"
                      data-testid="select-timer"
                    >
                      {TIMER_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="passing-score" className="text-xs mb-1 block">
                      Passing Score (%)
                    </Label>
                    <Input
                      id="passing-score"
                      type="number"
                      min={1}
                      max={100}
                      value={passingScore}
                      onChange={(e) => setPassingScore(Number(e.target.value))}
                      className="text-sm"
                      aria-label="Passing score percentage"
                      data-testid="input-passing-score"
                    />
                  </div>
                </div>

                {/* Add Question Form */}
                <div className="border border-dashed border-border rounded-xl p-4 space-y-3 bg-muted/30">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Add a Question</p>

                  <div>
                    <Label htmlFor="new-question" className="text-xs mb-1 block">Question</Label>
                    <Input
                      id="new-question"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="e.g., What keyboard shortcut saves a file?"
                      aria-label="Enter assessment question"
                      data-testid="input-new-question"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Answer Options — click the circle to mark the correct answer</p>
                    {newOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setNewCorrectIndex(idx)}
                          aria-label={`Mark option ${idx + 1} as correct answer`}
                          aria-pressed={newCorrectIndex === idx}
                          data-testid={`button-correct-${idx}`}
                          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                            newCorrectIndex === idx
                              ? "border-primary bg-primary"
                              : "border-muted-foreground hover:border-primary/60"
                          }`}
                        >
                          {newCorrectIndex === idx && (
                            <div className="w-2 h-2 rounded-full bg-white" aria-hidden="true" />
                          )}
                        </button>
                        <Input
                          value={opt}
                          onChange={(e) => updateOption(idx, e.target.value)}
                          placeholder={`Option ${idx + 1}${idx < 2 ? " (required)" : " (optional)"}`}
                          className="flex-1 text-sm h-9"
                          aria-label={`Answer option ${idx + 1}`}
                          data-testid={`input-option-${idx}`}
                        />
                      </div>
                    ))}
                  </div>

                  {optionError && (
                    <p className="text-xs text-destructive" role="alert">{optionError}</p>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAssessmentQuestion}
                    className="w-full gap-2"
                    aria-label="Add assessment question"
                    data-testid="button-add-question"
                  >
                    <Plus size={14} aria-hidden="true" /> Add Question
                  </Button>
                </div>

                {/* Question List */}
                {assessmentQuestions.length > 0 ? (
                  <ul className="space-y-2" aria-label="Assessment questions">
                    {assessmentQuestions.map((q, index) => (
                      <li
                        key={q.id}
                        className="border border-border rounded-xl bg-background overflow-hidden"
                        data-testid={`question-item-${index}`}
                      >
                        <div className="flex items-center justify-between px-4 py-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                            className="flex items-center gap-2 flex-1 text-left min-w-0"
                            aria-expanded={expandedQuestion === q.id}
                            aria-controls={`question-options-${q.id}`}
                            aria-label={`Toggle question ${index + 1} details`}
                          >
                            <span className="text-xs font-bold text-primary flex-shrink-0">Q{index + 1}</span>
                            <span className="text-sm text-foreground truncate">{q.question}</span>
                            {expandedQuestion === q.id
                              ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0" aria-hidden="true" />
                              : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" aria-hidden="true" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAssessmentQuestion(q.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all flex-shrink-0"
                            aria-label={`Remove question ${index + 1}`}
                            data-testid={`button-remove-question-${index}`}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        </div>

                        {expandedQuestion === q.id && (
                          <div
                            id={`question-options-${q.id}`}
                            className="px-4 pb-3 space-y-1.5"
                          >
                            {q.options.map((opt, oi) => (
                              <div
                                key={oi}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                  oi === q.correctIndex
                                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 font-medium"
                                    : "bg-muted/40 text-foreground"
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                    oi === q.correctIndex ? "border-green-500 bg-green-500" : "border-muted-foreground"
                                  }`}
                                  aria-hidden="true"
                                >
                                  {oi === q.correctIndex && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  )}
                                </div>
                                <span>{opt}</span>
                                {oi === q.correctIndex && (
                                  <Badge className="ml-auto text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-0">
                                    Correct
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Brain size={28} className="mx-auto mb-2 opacity-30" aria-hidden="true" />
                    <p className="text-xs">No questions added yet. Add at least 1 question to enable the assessment.</p>
                  </div>
                )}

                {/* Summary */}
                {assessmentQuestions.length > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-wrap gap-3 text-xs text-foreground">
                    <span><span className="font-semibold">{assessmentQuestions.length}</span> question{assessmentQuestions.length > 1 ? "s" : ""}</span>
                    <span>·</span>
                    <span><span className="font-semibold">{TIMER_OPTIONS.find((t) => t.value === assessmentTimer)?.label}</span> time limit</span>
                    <span>·</span>
                    <span>Pass at <span className="font-semibold">{passingScore}%</span> or above</span>
                  </div>
                )}
              </>
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
