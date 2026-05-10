import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import {
  Briefcase, ClipboardList, Target, TrendingUp, Star,
  MapPin, Building2, ChevronRight, Clock, CheckCircle2,
  AlertCircle, Eye,
} from "lucide-react";

interface JobMatch {
  id: number;
  jobId: number;
  seekerId: number;
  fitScore: number;
  matchedSkills: string[];
  status: string;
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    type: string;
    requiredSkills: string[];
    salary?: string;
    description: string;
  } | null;
}

interface Assessment {
  id: number;
  category: string;
  score: number;
}

const categoryLabels: Record<string, string> = {
  computer_literacy: "Computer Literacy",
  communication: "Communication Skills",
  data_entry: "Data Entry & Accuracy",
  problem_solving: "Problem Solving",
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "New Match", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: <Target size={12} /> },
  viewed: { label: "Viewed", color: "bg-muted text-muted-foreground", icon: <Eye size={12} /> },
  accepted: { label: "Interested", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle2 size={12} /> },
  rejected: { label: "Not Interested", color: "bg-muted text-muted-foreground", icon: <AlertCircle size={12} /> },
};

function FitScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? "text-green-600 dark:text-green-400" : score >= 50 ? "text-amber-600 dark:text-amber-400" : "text-orange-600 dark:text-orange-400";
  const progressClass = score >= 75 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-orange-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${progressClass}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-sm font-bold tabular-nums ${color}`} aria-label={`Fit score: ${score} percent`}>
        {score}%
      </span>
    </div>
  );
}

const typeLabels: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  freelance: "Freelance",
};

export default function SeekerDashboard() {
  const { user } = useAuth();

  const { data: matches, isLoading: matchesLoading } = useQuery<JobMatch[]>({
    queryKey: ["/api/matches/seeker", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/matches/seeker/${user?.id}`);
      return res.json();
    },
    enabled: !!user?.id,
  });

  const { data: assessments, isLoading: assessmentsLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/assessments/${user?.id}`);
      return res.json();
    },
    enabled: !!user?.id,
  });

  const skills: string[] = user?.skills ? JSON.parse(user.skills) : [];
  const topMatches = (matches || []).slice(0, 3);
  const avgScore = matches?.length
    ? Math.round(matches.reduce((s, m) => s + m.fitScore, 0) / matches.length)
    : 0;

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2
                className="text-xl font-bold text-foreground"
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
                data-testid="text-welcome"
              >
                Welcome back, {user?.name?.split(" ")[0]}! 👋
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {matches?.length
                  ? `You have ${matches.length} job match${matches.length !== 1 ? "es" : ""} waiting for you.`
                  : "Complete your profile and take assessments to get job matches."}
              </p>
            </div>
            <Button asChild size="sm" className="gap-2 flex-shrink-0">
              <Link href="/seeker/assessment" data-testid="link-take-assessment">
                <ClipboardList size={15} /> Take Assessment
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" role="list" aria-label="Dashboard statistics">
          {[
            {
              label: "Job Matches",
              value: matchesLoading ? "—" : String(matches?.length ?? 0),
              icon: <Briefcase size={18} />,
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              label: "Avg. Fit Score",
              value: matchesLoading ? "—" : `${avgScore}%`,
              icon: <Target size={18} />,
              color: "text-green-600 dark:text-green-400",
              bg: "bg-green-500/10",
            },
            {
              label: "Assessments Done",
              value: assessmentsLoading ? "—" : String(assessments?.length ?? 0),
              icon: <ClipboardList size={18} />,
              color: "text-blue-600 dark:text-blue-400",
              bg: "bg-blue-500/10",
            },
            {
              label: "Skills Listed",
              value: String(skills.length),
              icon: <Star size={18} />,
              color: "text-amber-600 dark:text-amber-400",
              bg: "bg-amber-500/10",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-card border border-border/60 rounded-xl p-4"
              role="listitem"
            >
              <div className={`inline-flex p-2 rounded-lg ${stat.bg} ${stat.color} mb-3`} aria-hidden="true">
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-foreground" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Job Matches Panel */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                Top Job Matches
              </h3>
              {(matches?.length ?? 0) > 3 && (
                <Button asChild variant="ghost" size="sm" className="gap-1 text-xs" data-testid="link-view-all-matches">
                  <Link href="/seeker/jobs">View All <ChevronRight size={14} /></Link>
                </Button>
              )}
            </div>

            <div className="space-y-3" role="list" aria-label="Top job matches" aria-live="polite">
              {matchesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border/60 rounded-xl p-5">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-32 mb-4" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))
              ) : topMatches.length === 0 ? (
                <div className="bg-card border border-border/60 rounded-xl p-8 text-center" role="status" aria-live="polite">
                  <Target className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" aria-hidden="true" />
                  <p className="text-sm font-medium text-foreground mb-1">No matches yet</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Update your profile with skills, then take skill assessments to generate matches.
                  </p>
                  <Button asChild size="sm" className="gap-2">
                    <Link href="/seeker/profile" data-testid="link-update-profile">
                      Update Profile
                    </Link>
                  </Button>
                </div>
              ) : (
                topMatches.map((match) => {
                  if (!match.job) return null;
                  const statusInfo = statusConfig[match.status] || statusConfig.pending;
                  return (
                    <article
                      key={match.id}
                      className="bg-card border border-border/60 rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all"
                      role="listitem"
                      data-testid={`card-match-${match.id}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-foreground text-sm leading-tight truncate">
                            {match.job.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Building2 size={11} aria-hidden="true" /> {match.job.company}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={11} aria-hidden="true" /> {match.job.location}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                              {typeLabels[match.job.type] || match.job.type}
                            </Badge>
                          </div>
                        </div>
                        <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusInfo.color}`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Fit Score</span>
                          <span className="font-medium text-foreground">
                            {match.matchedSkills.length}/{match.job.requiredSkills.length} skills matched
                          </span>
                        </div>
                        <FitScoreBar score={match.fitScore} />
                      </div>

                      {match.matchedSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5" aria-label="Matched skills">
                          {match.matchedSkills.slice(0, 4).map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-[10px] bg-primary/10 text-primary border-0 px-2"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {match.matchedSkills.length > 4 && (
                            <Badge variant="secondary" className="text-[10px] border-0 px-2">
                              +{match.matchedSkills.length - 4} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {match.job.salary && (
                        <p className="text-xs text-muted-foreground mt-2">
                          <span className="font-medium text-foreground">{match.job.salary}</span>
                        </p>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            {/* Assessment Scores */}
            <div className="bg-card border border-border/60 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground text-sm" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                  Assessment Scores
                </h3>
                <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs" data-testid="link-take-assessment-side">
                  <Link href="/seeker/assessment">Retake</Link>
                </Button>
              </div>

              {assessmentsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-3 w-32 mb-1.5" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4" aria-label="Assessment scores">
                  {Object.keys(categoryLabels).map((cat) => {
                    const assessment = assessments?.find((a) => a.category === cat);
                    return (
                      <div key={cat}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs text-muted-foreground">{categoryLabels[cat]}</span>
                          <span className="text-xs font-semibold text-foreground tabular-nums">
                            {assessment ? `${assessment.score}%` : "Not taken"}
                          </span>
                        </div>
                        <Progress
                          value={assessment?.score ?? 0}
                          className="h-1.5"
                          aria-label={`${categoryLabels[cat]}: ${assessment?.score ?? 0}%`}
                        />
                      </div>
                    );
                  })}
                  {(!assessments || assessments.length === 0) && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No assessments taken yet.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Profile Skills */}
            <div className="bg-card border border-border/60 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground text-sm" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                  Your Skills
                </h3>
                <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs" data-testid="link-edit-skills">
                  <Link href="/seeker/profile">Edit</Link>
                </Button>
              </div>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5" aria-label="Your skills">
                  {skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="text-xs bg-muted text-foreground border-0"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-xs text-muted-foreground mb-2">No skills added yet.</p>
                  <Button asChild variant="outline" size="sm" className="h-7 text-xs" data-testid="link-add-skills">
                    <Link href="/seeker/profile">Add Skills</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border/60 rounded-xl p-5">
              <h3 className="font-semibold text-foreground text-sm mb-3" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2 h-9 text-xs" data-testid="link-quick-browse-jobs">
                  <Link href="/seeker/jobs"><Briefcase size={14} /> Browse All Jobs</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2 h-9 text-xs" data-testid="link-quick-profile">
                  <Link href="/seeker/profile"><TrendingUp size={14} /> Update Profile</Link>
                </Button>
                <Button asChild size="sm" className="w-full justify-start gap-2 h-9 text-xs" data-testid="link-quick-assessment">
                  <Link href="/seeker/assessment"><ClipboardList size={14} /> Take Assessment</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
