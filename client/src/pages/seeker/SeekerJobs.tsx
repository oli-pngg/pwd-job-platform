import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Search, MapPin, Building2, Briefcase, Clock, ChevronDown,
  ChevronUp, Star, Filter, RefreshCw,
} from "lucide-react";

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

export default function SeekerJobs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);

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
      const data = await res.json();
      return data;
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
      toast({
        title: "Matches Generated",
        description: `Found ${data.matches} job matches for you.`,
      });
    },
  });

  const expressInterestMutation = useMutation({
    mutationFn: async ({ matchId, status }: { matchId: number; status: string }) => {
      const res = await apiRequest("POST", `/api/matches/${matchId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches/seeker", user?.id] });
      toast({ title: "Status updated!" });
    },
  });

  const matchMap = new Map<number, JobMatch>();
  (matches || []).forEach((m) => matchMap.set(m.jobId, m));

  const filteredJobs = (jobs || []).filter((j) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.requiredSkills.some((s) => s.toLowerCase().includes(q));
    const matchesType = !typeFilter || j.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const scoreA = matchMap.get(a.id)?.fitScore ?? 0;
    const scoreB = matchMap.get(b.id)?.fitScore ?? 0;
    return scoreB - scoreA;
  });

  return (
    <DashboardLayout title="Browse Jobs">
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
            <Button
              variant={typeFilter === "" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("")}
              className="text-xs"
              data-testid="button-filter-all"
            >
              All
            </Button>
            {Object.entries(typeLabels).map(([val, label]) => (
              <Button
                key={val}
                variant={typeFilter === val ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(val === typeFilter ? "" : val)}
                className="text-xs"
                data-testid={`button-filter-${val}`}
              >
                {label}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateMatchesMutation.mutate()}
            disabled={generateMatchesMutation.isPending}
            className="gap-2 text-xs"
            data-testid="button-regenerate-matches"
            aria-label="Regenerate job matches based on your current profile"
          >
            <RefreshCw size={14} className={generateMatchesMutation.isPending ? "animate-spin" : ""} aria-hidden="true" />
            Refresh Matches
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
              <Star size={12} className="inline mr-1 text-primary" aria-hidden="true" />
              Sorted by fit score
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
                            <h3 className="font-semibold text-foreground text-base leading-tight">
                              {job.title}
                            </h3>
                            {match && (
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                  match.fitScore >= 75
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : match.fitScore >= 50
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                }`}
                                aria-label={`Fit score: ${match.fitScore}%`}
                                data-testid={`text-fit-score-${job.id}`}
                              >
                                {match.fitScore}% Match
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Building2 size={11} aria-hidden="true" /> {job.company}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={11} aria-hidden="true" /> {job.location}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${typeColors[job.type] || "bg-muted text-muted-foreground"}`}>
                              {typeLabels[job.type] || job.type}
                            </span>
                          </div>
                          {job.salary && (
                            <p className="text-xs font-medium text-foreground mt-1.5">{job.salary}</p>
                          )}
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          {match ? (
                            match.status === "accepted" ? (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-xs">
                                Interested ✓
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => expressInterestMutation.mutate({ matchId: match.id, status: "accepted" })}
                                disabled={expressInterestMutation.isPending}
                                data-testid={`button-express-interest-${job.id}`}
                                aria-label={`Express interest in ${job.title}`}
                              >
                                Express Interest
                              </Button>
                            )
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              No match data
                            </Badge>
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
                            <Badge
                              key={skill}
                              variant="secondary"
                              className={`text-[10px] border-0 px-2 ${
                                isMatched
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }`}
                              title={isMatched ? "You have this skill!" : undefined}
                            >
                              {isMatched && <span className="mr-0.5" aria-hidden="true">✓</span>}
                              {skill}
                            </Badge>
                          );
                        })}
                        {job.requiredSkills.length > 5 && (
                          <Badge variant="secondary" className="text-[10px] border-0 px-2">
                            +{job.requiredSkills.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div
                        id={`job-details-${job.id}`}
                        className="border-t border-border/60 px-5 py-4 bg-muted/20"
                      >
                        <h4 className="text-sm font-semibold text-foreground mb-2">Job Description</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {job.description}
                        </p>
                        {match && match.matchedSkills.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-foreground mb-2">
                              Your Matched Skills ({match.matchedSkills.length}/{job.requiredSkills.length})
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {match.matchedSkills.map((skill) => (
                                <Badge
                                  key={skill}
                                  className="bg-primary/10 text-primary border-0 text-xs"
                                >
                                  ✓ {skill}
                                </Badge>
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
