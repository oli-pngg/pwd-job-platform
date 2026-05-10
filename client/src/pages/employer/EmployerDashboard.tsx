import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Briefcase, PlusCircle, Users, Target, MapPin, ChevronRight,
  Trash2, ToggleLeft, ToggleRight, Clock, Building2,
} from "lucide-react";

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  requiredSkills: string[];
  salary?: string;
  isActive: boolean;
  createdAt?: string;
}

const typeLabels: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  freelance: "Freelance",
};

export default function EmployerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["/api/employer", user?.id, "jobs"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/employer/${user?.id}/jobs`);
      return res.json();
    },
    enabled: !!user?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/stats");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ jobId, isActive }: { jobId: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/jobs/${jobId}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer", user?.id, "jobs"] });
      toast({ title: "Job status updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await apiRequest("DELETE", `/api/jobs/${jobId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer", user?.id, "jobs"] });
      toast({ title: "Job deleted", description: "The job listing has been removed." });
    },
  });

  const activeJobs = (jobs || []).filter((j) => j.isActive);
  const totalJobs = jobs?.length || 0;

  return (
    <DashboardLayout title="Employer Dashboard">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2
                className="text-xl font-bold text-foreground"
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
                data-testid="text-welcome"
              >
                Welcome, {user?.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {user?.company} · Inclusive employer in Legazpi City
              </p>
            </div>
            <Button asChild className="gap-2 flex-shrink-0" data-testid="link-post-job">
              <Link href="/employer/post-job">
                <PlusCircle size={16} aria-hidden="true" /> Post a Job
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4" role="list" aria-label="Dashboard statistics">
          {[
            {
              label: "Active Jobs",
              value: isLoading ? "—" : String(activeJobs.length),
              icon: <Briefcase size={18} />,
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              label: "Total Posted",
              value: isLoading ? "—" : String(totalJobs),
              icon: <Building2 size={18} />,
              color: "text-blue-600 dark:text-blue-400",
              bg: "bg-blue-500/10",
            },
            {
              label: "Total PWD Seekers",
              value: stats ? String(stats.totalSeekers) : "—",
              icon: <Users size={18} />,
              color: "text-green-600 dark:text-green-400",
              bg: "bg-green-500/10",
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

        {/* Job Listings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3
              className="font-semibold text-foreground"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
            >
              Your Job Listings
            </h3>
            <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs" data-testid="link-post-new-job">
              <Link href="/employer/post-job">
                <PlusCircle size={13} /> New Listing
              </Link>
            </Button>
          </div>

          <div className="space-y-3" role="list" aria-label="Job listings">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card border border-border/60 rounded-xl p-5">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-32 mb-4" />
                  <Skeleton className="h-8 w-32" />
                </div>
              ))
            ) : (jobs || []).length === 0 ? (
              <div className="bg-card border border-border/60 rounded-xl p-12 text-center" role="status">
                <Briefcase className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" aria-hidden="true" />
                <p className="font-medium text-foreground mb-1">No job listings yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Post your first job to start receiving PWD candidate matches.
                </p>
                <Button asChild className="gap-2" data-testid="link-first-job">
                  <Link href="/employer/post-job">
                    <PlusCircle size={15} /> Post Your First Job
                  </Link>
                </Button>
              </div>
            ) : (
              (jobs || []).map((job) => (
                <article
                  key={job.id}
                  className={`bg-card border rounded-xl p-5 transition-all ${
                    job.isActive ? "border-border/60 hover:border-primary/30" : "border-border/40 opacity-70"
                  }`}
                  role="listitem"
                  data-testid={`card-job-${job.id}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-semibold text-foreground">{job.title}</h4>
                        <Badge
                          variant={job.isActive ? "default" : "secondary"}
                          className={`text-[10px] px-2 py-0 h-4 ${
                            job.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0"
                              : ""
                          }`}
                        >
                          {job.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} aria-hidden="true" /> {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} aria-hidden="true" /> {typeLabels[job.type] || job.type}
                        </span>
                        {job.salary && <span className="font-medium text-foreground">{job.salary}</span>}
                      </div>
                      {job.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.requiredSkills.slice(0, 4).map((s) => (
                            <Badge key={s} variant="secondary" className="text-[10px] border-0 px-2">
                              {s}
                            </Badge>
                          ))}
                          {job.requiredSkills.length > 4 && (
                            <Badge variant="secondary" className="text-[10px] border-0 px-2">
                              +{job.requiredSkills.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs h-8"
                        data-testid={`link-candidates-${job.id}`}
                      >
                        <Link href={`/employer/candidates/${job.id}`}>
                          <Users size={13} aria-hidden="true" /> Candidates <ChevronRight size={12} />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => toggleMutation.mutate({ jobId: job.id, isActive: !job.isActive })}
                        aria-label={job.isActive ? "Deactivate job listing" : "Activate job listing"}
                        data-testid={`button-toggle-job-${job.id}`}
                      >
                        {job.isActive ? <ToggleRight size={18} className="text-primary" /> : <ToggleLeft size={18} />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Delete "${job.title}"?`)) {
                            deleteMutation.mutate(job.id);
                          }
                        }}
                        aria-label={`Delete job: ${job.title}`}
                        data-testid={`button-delete-job-${job.id}`}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
