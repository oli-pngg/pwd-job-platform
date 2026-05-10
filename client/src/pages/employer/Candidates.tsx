import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users, MapPin, Briefcase, Star, CheckCircle2, XCircle,
  Shield, Award, ChevronDown, ChevronUp,
} from "lucide-react";
import { useState } from "react";

interface CandidateMatch {
  id: number;
  fitScore: number;
  matchedSkills: string[];
  status: string;
  seeker: {
    id: number;
    name: string;
    city: string;
    workPreference: string;
    skills: string[];
  };
  assessments: { category: string; score: number }[];
}

const categoryLabels: Record<string, string> = {
  computer_literacy: "Computer Lit.",
  communication: "Communication",
  data_entry: "Data Entry",
  problem_solving: "Problem Solving",
};

const workPrefLabels: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  freelance: "Freelance",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-muted text-muted-foreground" },
  viewed: { label: "Viewed", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  shortlisted: { label: "Shortlisted ✓", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  rejected: { label: "Passed", color: "bg-muted text-muted-foreground" },
};

export default function Candidates() {
  const [, params] = useRoute("/employer/candidates/:jobId");
  const jobId = params?.jobId ? Number(params.jobId) : null;
  const { user } = useAuth();
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: job } = useQuery({
    queryKey: ["/api/jobs", jobId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/jobs/${jobId}`);
      return res.json();
    },
    enabled: !!jobId,
  });

  const { data: candidates, isLoading } = useQuery<CandidateMatch[]>({
    queryKey: ["/api/matches/job", jobId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/matches/job/${jobId}`);
      return res.json();
    },
    enabled: !!jobId,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ matchId, status }: { matchId: number; status: string }) => {
      const res = await apiRequest("POST", `/api/matches/${matchId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches/job", jobId] });
      toast({ title: "Candidate status updated" });
    },
  });

  return (
    <DashboardLayout title="Matched Candidates">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Job info header */}
        {job && (
          <div className="bg-card border border-border/60 rounded-2xl p-5">
            <h2 className="font-bold text-foreground text-lg" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              {job.title}
            </h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin size={13} aria-hidden="true" /> {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase size={13} aria-hidden="true" /> {workPrefLabels[job.type] || job.type}
              </span>
              {job.salary && <span>{job.salary}</span>}
            </div>
          </div>
        )}

        {/* Blind matching notice */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
          <Shield size={18} className="text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-foreground">Blind Matching Active</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Disability information is not shown. Candidates are ranked by skill compatibility only. You can request
              full profiles during the interview stage.
            </p>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground" aria-live="polite" role="status">
            {isLoading
              ? "Loading candidates..."
              : `${candidates?.length || 0} candidate${candidates?.length !== 1 ? "s" : ""} matched`}
          </p>
          {(candidates?.length || 0) > 0 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Star size={12} className="text-primary" aria-hidden="true" /> Sorted by fit score
            </p>
          )}
        </div>

        {/* Candidate cards */}
        <div className="space-y-3" role="list" aria-label="Matched candidates">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-border/60 rounded-xl p-5">
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-3 w-28 mb-4" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))
          ) : !candidates || candidates.length === 0 ? (
            <div className="bg-card border border-border/60 rounded-xl p-12 text-center" role="status">
              <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" aria-hidden="true" />
              <p className="font-medium text-foreground mb-1">No candidates matched yet</p>
              <p className="text-sm text-muted-foreground">
                Matching runs automatically when PWD seekers update their profiles or take assessments.
              </p>
            </div>
          ) : (
            candidates.map((candidate) => {
              if (!candidate.seeker) return null;
              const isExpanded = expandedId === candidate.id;
              const statusInfo = statusConfig[candidate.status] || statusConfig.pending;
              return (
                <article
                  key={candidate.id}
                  className="bg-card border border-border/60 rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all"
                  role="listitem"
                  data-testid={`card-candidate-${candidate.id}`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Anonymous avatar */}
                        <div
                          className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0"
                          aria-hidden="true"
                        >
                          {candidate.seeker.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-foreground text-sm">
                              {candidate.seeker.name}
                            </h4>
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}
                              data-testid={`badge-status-${candidate.id}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                            {candidate.seeker.city && (
                              <span className="flex items-center gap-1">
                                <MapPin size={11} aria-hidden="true" /> {candidate.seeker.city}
                              </span>
                            )}
                            {candidate.seeker.workPreference && (
                              <span className="flex items-center gap-1">
                                <Briefcase size={11} aria-hidden="true" /> {workPrefLabels[candidate.seeker.workPreference] || candidate.seeker.workPreference}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <div
                            className={`text-lg font-bold tabular-nums ${
                              candidate.fitScore >= 75
                                ? "text-green-600 dark:text-green-400"
                                : candidate.fitScore >= 50
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-orange-600 dark:text-orange-400"
                            }`}
                            data-testid={`text-fit-score-${candidate.id}`}
                            aria-label={`Fit score: ${candidate.fitScore}%`}
                          >
                            {candidate.fitScore}%
                          </div>
                          <div className="text-[10px] text-muted-foreground">Fit Score</div>
                        </div>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : candidate.id)}
                          aria-expanded={isExpanded}
                          aria-controls={`candidate-details-${candidate.id}`}
                          aria-label={isExpanded ? "Collapse candidate details" : "Expand candidate details"}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                          data-testid={`button-expand-candidate-${candidate.id}`}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Fit score bar */}
                    <div className="mt-3 mb-3">
                      <Progress
                        value={candidate.fitScore}
                        className="h-1.5"
                        aria-label={`Fit score: ${candidate.fitScore}%`}
                      />
                    </div>

                    {/* Matched skills */}
                    {candidate.matchedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3" aria-label="Matched skills">
                        {candidate.matchedSkills.slice(0, 5).map((s) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="text-[10px] bg-primary/10 text-primary border-0 px-2"
                          >
                            ✓ {s}
                          </Badge>
                        ))}
                        {candidate.matchedSkills.length > 5 && (
                          <Badge variant="secondary" className="text-[10px] border-0 px-2">
                            +{candidate.matchedSkills.length - 5}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs h-8"
                        disabled={candidate.status === "shortlisted" || statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ matchId: candidate.id, status: "shortlisted" })}
                        data-testid={`button-shortlist-${candidate.id}`}
                        aria-label={`Shortlist ${candidate.seeker.name}`}
                      >
                        <CheckCircle2 size={13} aria-hidden="true" />
                        {candidate.status === "shortlisted" ? "Shortlisted" : "Shortlist"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs h-8"
                        disabled={candidate.status === "rejected" || statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ matchId: candidate.id, status: "rejected" })}
                        data-testid={`button-pass-${candidate.id}`}
                        aria-label={`Pass on ${candidate.seeker.name}`}
                      >
                        <XCircle size={13} aria-hidden="true" />
                        Pass
                      </Button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div
                      id={`candidate-details-${candidate.id}`}
                      className="border-t border-border/60 px-5 py-4 bg-muted/20"
                    >
                      {/* All skills */}
                      {candidate.seeker.skills.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">All Skills</h5>
                          <div className="flex flex-wrap gap-1.5">
                            {candidate.seeker.skills.map((s) => (
                              <Badge key={s} variant="secondary" className="text-[10px] border-0 px-2">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assessment scores */}
                      {candidate.assessments.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-1.5">
                            <Award size={12} aria-hidden="true" /> Verified Assessment Scores
                          </h5>
                          <div className="grid grid-cols-2 gap-3">
                            {candidate.assessments.map((a) => (
                              <div key={a.category}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">{categoryLabels[a.category] || a.category}</span>
                                  <span
                                    className={`font-semibold ${
                                      a.score >= 80
                                        ? "text-green-600 dark:text-green-400"
                                        : a.score >= 60
                                        ? "text-primary"
                                        : "text-amber-600 dark:text-amber-400"
                                    }`}
                                  >
                                    {a.score}%
                                  </span>
                                </div>
                                <Progress value={a.score} className="h-1.5" aria-label={`${categoryLabels[a.category]}: ${a.score}%`} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
