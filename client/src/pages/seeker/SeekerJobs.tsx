import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Search, MapPin, Building2, Briefcase, Clock, ChevronDown,
  ChevronUp, Star, RefreshCw, Brain, CheckCircle2, XCircle,
  AlertTriangle, ArrowRight, ArrowLeft, Award,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssessmentQuestion {
  question: string;
  options: string[];
}

interface JobAssessmentData {
  alreadyTaken: boolean;
  timer: number;
  passingScore: number;
  questions?: AssessmentQuestion[];
  score?: number;
  passed?: boolean;
  totalQuestions?: number;
}

interface Job {
  id: number;
  employerId: number;
  title: string;
  description: string;
  company: string;
  location: string;
  type: string;
  requiredSkills: string[];
  salary?: string;
  isActive: boolean;
  hasAssessment: boolean;
}

interface JobMatch {
  id: number;
  jobId: number;
  fitScore: number;
  matchedSkills: string[];
  status: string;
}

const typeLabels: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  freelance: "Freelance",
};

const typeColors: Record<string, string> = {
  full_time: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  part_time: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  freelance: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

// ─── ModalShell ───────────────────────────────────────────────────────────────

function ModalShell({
  children,
  onClose,
  ariaLabel = "Dialog",
}: {
  children: React.ReactNode;
  onClose: () => void;
  ariaLabel?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        {children}
      </div>
    </div>
  );
}

// ─── Assessment Modal ─────────────────────────────────────────────────────────

interface AssessmentModalProps {
  job: Job;
  userId: number;
  onClose: () => void;
  onPassed: () => void;
}

function AssessmentModal({ job, userId, onClose, onPassed }: AssessmentModalProps) {
  const { toast } = useToast();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; passingScore: number; correct: number; totalQuestions: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const { data: assessmentData, isLoading } = useQuery<JobAssessmentData>({
    queryKey: ["/api/jobs", job.id, "assessment", userId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/jobs/${job.id}/assessment`);
      if (!res.ok) throw new Error("Failed to load assessment");
      return res.json();
    },
  });

  useEffect(() => {
    if (assessmentData && !assessmentData.alreadyTaken && assessmentData.questions) {
      setAnswers(new Array(assessmentData.questions.length).fill(null));
      setTimeLeft(assessmentData.timer);
    }
  }, [assessmentData]);

  const submitMutation = useMutation({
    mutationFn: async (finalAnswers: (number | null)[]) => {
      const res = await apiRequest("POST", `/api/jobs/${job.id}/assessment-result`, {
        seekerId: userId,
        answers: finalAnswers.map((a) => (a === null ? -1 : a)),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Submission failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", job.id, "assessment", userId] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = useCallback((finalAnswers?: (number | null)[]) => {
    if (submitted) return;
    submitMutation.mutate(finalAnswers ?? answers);
  }, [submitted, answers]);

  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const t = setTimeout(() => setTimeLeft((s) => (s !== null ? s - 1 : s)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, submitted]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const selectAnswer = (idx: number) => {
    if (submitted) return;
    const updated = [...answers];
    updated[currentQ] = idx;
    setAnswers(updated);
  };

  if (assessmentData?.alreadyTaken) {
    return (
      <ModalShell onClose={onClose} ariaLabel="Skill Assessment Result">
        <div className="text-center space-y-4 py-4">
          <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${assessmentData.passed ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
            {assessmentData.passed ? <Award size={32} className="text-green-600 dark:text-green-400" /> : <XCircle size={32} className="text-red-600 dark:text-red-400" />}
          </div>
          <h3 className="text-lg font-semibold text-foreground">{assessmentData.passed ? "Assessment Passed!" : "Assessment Not Passed"}</h3>
          <p className="text-sm text-muted-foreground">You scored <span className="font-bold text-foreground">{assessmentData.score}%</span>. Passing score is {assessmentData.passingScore}%.</p>
          {assessmentData.passed ? (
            <div className="space-y-3">
              <p className="text-sm text-green-700 dark:text-green-400">You can express interest in this job.</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                <Button size="sm" onClick={onPassed}>Express Interest</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">You may not re-take this assessment.</p>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
          )}
        </div>
      </ModalShell>
    );
  }

  if (submitted && result) {
    return (
      <ModalShell onClose={onClose} ariaLabel="Skill Assessment Result">
        <div className="text-center space-y-4 py-4">
          <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${result.passed ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
            {result.passed ? <Award size={32} className="text-green-600 dark:text-green-400" /> : <XCircle size={32} className="text-red-600 dark:text-red-400" />}
          </div>
          <h3 className="text-lg font-semibold text-foreground">{result.passed ? "You Passed! 🎉" : "Not Passed"}</h3>
          <div className="bg-muted/40 rounded-xl p-4 space-y-1 text-sm">
            <p>Score: <span className="font-bold text-foreground">{result.score}%</span></p>
            <p>Correct: <span className="font-bold text-foreground">{result.correct} / {result.totalQuestions}</span></p>
            <p>Passing Score: <span className="font-bold text-foreground">{result.passingScore}%</span></p>
          </div>
          {result.passed ? (
            <div className="space-y-3">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">You qualify! You can now express interest in this job.</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={onClose}>Later</Button>
                <Button size="sm" className="gap-1" onClick={onPassed}>Express Interest <ArrowRight size={14} /></Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">You did not meet the required passing score. You may not re-take this assessment.</p>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
          )}
        </div>
      </ModalShell>
    );
  }

  if (isLoading || !assessmentData || !assessmentData.questions) {
    return (
      <ModalShell onClose={onClose} ariaLabel="Skill Assessment">
        <div className="space-y-3 py-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </ModalShell>
    );
  }

  const questions = assessmentData.questions;
  const q = questions[currentQ];
  const answered = answers.filter((a) => a !== null).length;
  const progress = Math.round((answered / questions.length) * 100);
  const isLast = currentQ === questions.length - 1;

  return (
    <ModalShell onClose={onClose} ariaLabel="Skill Assessment">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1.5"><Brain size={12} aria-hidden="true" /> Skill Assessment</p>
          <h3 className="text-sm font-semibold text-foreground mt-0.5">{job.title}</h3>
        </div>
        {timeLeft !== null && (
          <div className={`flex items-center gap-1.5 text-sm font-mono font-semibold px-3 py-1.5 rounded-lg ${timeLeft <= 60 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-muted text-foreground"}`} aria-label={`Time remaining: ${formatTime(timeLeft)}`} aria-live="off">
            <Clock size={13} aria-hidden="true" /> {formatTime(timeLeft)}
          </div>
        )}
      </div>
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Question {currentQ + 1} of {questions.length}</span>
          <span>{answered} answered</span>
        </div>
        <Progress value={progress} className="h-1.5" aria-label={`${progress}% of questions answered`} />
      </div>
      <div className="mb-4">
        <p className="text-sm font-medium text-foreground leading-relaxed" id={`question-text-${currentQ}`}>{q.question}</p>
      </div>
      <div className="space-y-2 mb-6" role="radiogroup" aria-labelledby={`question-text-${currentQ}`}>
        {q.options.map((opt, oi) => (
          <button key={oi} type="button" role="radio" aria-checked={answers[currentQ] === oi} onClick={() => selectAnswer(oi)} data-testid={`option-${currentQ}-${oi}`}
            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${answers[currentQ] === oi ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/40"}`}>
            <span className="font-semibold mr-2 text-xs text-muted-foreground">{String.fromCharCode(65 + oi)}.</span>{opt}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setCurrentQ((q) => Math.max(0, q - 1))} disabled={currentQ === 0} className="gap-1" aria-label="Previous question">
          <ArrowLeft size={14} aria-hidden="true" /> Prev
        </Button>
        {isLast ? (
          <Button size="sm" onClick={() => handleSubmit()} disabled={submitMutation.isPending} className="gap-1" aria-label="Submit assessment" data-testid="button-submit-assessment">
            {submitMutation.isPending ? <span className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" aria-hidden="true" /> : <CheckCircle2 size={14} aria-hidden="true" />} Submit
          </Button>
        ) : (
          <Button size="sm" onClick={() => setCurrentQ((q) => Math.min(questions.length - 1, q + 1))} className="gap-1" aria-label="Next question">
            Next <ArrowRight size={14} aria-hidden="true" />
          </Button>
        )}
      </div>
      {isLast && answers.some((a) => a === null) && (
        <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5" role="alert">
          <AlertTriangle size={12} aria-hidden="true" /> {answers.filter((a) => a === null).length} question(s) unanswered. You can still submit.
        </p>
      )}
    </ModalShell>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SeekerJobs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [assessmentJobId, setAssessmentJobId] = useState<number | null>(null);

  const { data: jobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/jobs");
      return res.json();
    },
  });

  const { data: matches } = useQuery<JobMatch[]>({
    queryKey: ["/api/matches/seeker", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/matches/seeker/${user?.id}`);
      return res.json();
    },
    enabled: !!user?.id,
  });

  const generateMatchesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/matches/generate/${user?.id}`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches/seeker", user?.id] });
      toast({ title: "Matches Generated", description: `Found ${data.matches} job matches for you.` });
    },
  });

  const expressInterestMutation = useMutation({
    mutationFn: async ({ matchId, status }: { matchId: number; status: string }) => {
      const res = await apiRequest("POST", `/api/matches/${matchId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches/seeker", user?.id] });
      toast({ title: "Interest expressed!", description: "The employer can now see your profile." });
    },
  });

  const matchMap = new Map<number, JobMatch>();
  (matches || []).forEach((m) => matchMap.set(m.jobId, m));

  const filteredJobs = (jobs || []).filter((j) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.requiredSkills.some((s) => s.toLowerCase().includes(q));
    const matchesType = !typeFilter || j.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const scoreA = matchMap.get(a.id)?.fitScore ?? 0;
    const scoreB = matchMap.get(b.id)?.fitScore ?? 0;
    return scoreB - scoreA;
  });

  const assessmentJob = assessmentJobId !== null ? (jobs || []).find((j) => j.id === assessmentJobId) ?? null : null;

  const handleExpressInterest = (job: Job, match: JobMatch) => {
    if (job.hasAssessment) {
      setAssessmentJobId(job.id);
    } else {
      expressInterestMutation.mutate({ matchId: match.id, status: "accepted" });
    }
  };

  const handleAssessmentPassed = (match: JobMatch) => {
    setAssessmentJobId(null);
    expressInterestMutation.mutate({ matchId: match.id, status: "accepted" });
  };

  return (
    <DashboardLayout title="Browse Jobs">
      {/* Assessment Modal */}
      {assessmentJob && user && (
        <AssessmentModal
          job={assessmentJob}
          userId={user.id}
          onClose={() => setAssessmentJobId(null)}
          onPassed={() => {
            const match = matchMap.get(assessmentJob.id);
            if (match) handleAssessmentPassed(match);
            else setAssessmentJobId(null);
          }}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Search jobs, companies, skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Search jobs"
              data-testid="input-job-search"
            />
          </div>
          <div className="flex gap-2" role="group" aria-label="Filter by job type">
            <Button variant={typeFilter === "" ? "default" : "outline"} size="sm" onClick={() => setTypeFilter("")} className="text-xs" data-testid="button-filter-all">All</Button>
            {Object.entries(typeLabels).map(([val, label]) => (
              <Button key={val} variant={typeFilter === val ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(val === typeFilter ? "" : val)} className="text-xs" data-testid={`button-filter-${val}`}>{label}</Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => generateMatchesMutation.mutate()} disabled={generateMatchesMutation.isPending} className="gap-2 text-xs" data-testid="button-regenerate-matches" aria-label="Regenerate job matches">
            <RefreshCw size={14} className={generateMatchesMutation.isPending ? "animate-spin" : ""} aria-hidden="true" /> Refresh Matches
          </Button>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground" aria-live="polite" role="status">
            {jobsLoading ? "Loading jobs..." : `${sortedJobs.length} job${sortedJobs.length !== 1 ? "s" : ""} found`}
            {search && ` for "${search}"`}
          </p>
          {matches && matches.length > 0 && (
            <p className="text-xs text-muted-foreground">
              <Star size={12} className="inline mr-1 text-primary" aria-hidden="true" /> Sorted by fit score
            </p>
          )}
        </div>

        {/* Job Cards */}
        <div className="space-y-3" role="list" aria-label="Job listings" aria-live="polite">
          {jobsLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border border-border/60 rounded-xl p-5">
                  <Skeleton className="h-4 w-64 mb-2" />
                  <Skeleton className="h-3 w-48 mb-4" />
                  <Skeleton className="h-2 w-full mb-2" />
                  <Skeleton className="h-2 w-3/4" />
                </div>
              ))
            : sortedJobs.length === 0
            ? (
                <div className="bg-card border border-border/60 rounded-xl p-12 text-center" role="status">
                  <Briefcase className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" aria-hidden="true" />
                  <p className="font-medium text-foreground mb-1">No jobs found</p>
                  <p className="text-sm text-muted-foreground">
                    {search ? `No jobs match "${search}". Try a different search.` : "No active job listings at the moment."}
                  </p>
                </div>
              )
            : sortedJobs.map((job) => {
                const match = matchMap.get(job.id);
                const isExpanded = expandedJobId === job.id;
                return (
                  <article
                    key={job.id}
                    className="bg-card border border-border/60 rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all"
                    role="listitem"
                    data-testid={`card-job-${job.id}`}
                  >
                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground text-base leading-tight">{job.title}</h3>
                            {match && (
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                  match.fitScore >= 75 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : match.fitScore >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                }`}
                                aria-label={`Fit score: ${match.fitScore}%`}
                                data-testid={`text-fit-score-${job.id}`}
                              >
                                {match.fitScore}% Match
                              </span>
                            )}
                            {job.hasAssessment && (
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 flex-shrink-0" aria-label="This job requires a skill assessment">
                                <Brain size={10} aria-hidden="true" /> Assessment Required
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Building2 size={11} aria-hidden="true" /> {job.company}</span>
                            <span className="flex items-center gap-1"><MapPin size={11} aria-hidden="true" /> {job.location}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${typeColors[job.type] || "bg-muted text-muted-foreground"}`}>
                              {typeLabels[job.type] || job.type}
                            </span>
                          </div>
                          {job.salary && <p className="text-xs font-medium text-foreground mt-1.5">{job.salary}</p>}
                        </div>

                        <div className="flex gap-2 flex-shrink-0 flex-wrap">
                          {/* Skill Assessment button — only shown if job has an assessment */}
                          {job.hasAssessment && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1.5 border-violet-400/50 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                              onClick={() => setAssessmentJobId(job.id)}
                              aria-label={`Take skill assessment for ${job.title}`}
                              data-testid={`button-view-questions-${job.id}`}
                            >
                              <Brain size={12} aria-hidden="true" />
                              Skill Assessment
                            </Button>
                          )}

                          {match ? (
                            match.status === "accepted" ? (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-xs">Interested ✓</Badge>
                            ) : (
                              <Button
                                size="sm"
                                className="h-8 text-xs gap-1.5"
                                onClick={() => handleExpressInterest(job, match)}
                                disabled={expressInterestMutation.isPending}
                                data-testid={`button-express-interest-${job.id}`}
                                aria-label={job.hasAssessment ? `Take assessment for ${job.title}` : `Express interest in ${job.title}`}
                              >
                                {job.hasAssessment ? "Express Interest" : "Express Interest"}
                              </Button>
                            )
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">No match data</Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                            aria-expanded={isExpanded}
                            aria-controls={`job-details-${job.id}`}
                            aria-label={isExpanded ? "Collapse job details" : "Expand job details"}
                            data-testid={`button-toggle-job-${job.id}`}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </Button>
                        </div>
                      </div>

                      {/* Skills row */}
                      <div className="flex flex-wrap gap-1.5 mt-3" aria-label="Required skills">
                        {job.requiredSkills.slice(0, 5).map((skill) => {
                          const isMatched = match?.matchedSkills.includes(skill);
                          return (
                            <Badge key={skill} variant="secondary" className={`text-[10px] border-0 px-2 ${isMatched ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`} title={isMatched ? "You have this skill!" : undefined}>
                              {isMatched && <span className="mr-0.5" aria-hidden="true">✓</span>}{skill}
                            </Badge>
                          );
                        })}
                        {job.requiredSkills.length > 5 && (
                          <Badge variant="secondary" className="text-[10px] border-0 px-2">+{job.requiredSkills.length - 5} more</Badge>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div id={`job-details-${job.id}`} className="border-t border-border/60 px-5 py-4 bg-muted/20">
                        <h4 className="text-sm font-semibold text-foreground mb-2">Job Description</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p>

                        {/* Skill Assessment callout in expanded view */}
                        {job.hasAssessment && (
                          <div className="mt-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-3">
                            <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 flex items-center gap-1.5 mb-1">
                              <Brain size={12} aria-hidden="true" /> Skill Assessment Required
                            </p>
                            <p className="text-xs text-violet-600 dark:text-violet-400/80 mb-2">
                              This job requires a skill assessment before expressing interest. You can only take it once.
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 gap-1.5 border-violet-400/50 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                              onClick={() => setAssessmentJobId(job.id)}
                              aria-label={`Take skill assessment for ${job.title}`}
                            >
                              <Brain size={11} aria-hidden="true" /> Take Skill Assessment
                            </Button>
                          </div>
                        )}

                        {match && match.matchedSkills.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-foreground mb-2">Your Matched Skills ({match.matchedSkills.length}/{job.requiredSkills.length})</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {match.matchedSkills.map((skill) => (
                                <Badge key={skill} className="bg-primary/10 text-primary border-0 text-xs">✓ {skill}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
        </div>
      </div>
    </DashboardLayout>
  );
}
