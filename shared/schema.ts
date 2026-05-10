import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("pwd_seeker"), // 'pwd_seeker' | 'employer' | 'admin'
  disabilityType: text("disability_type"), // 'visual' | 'hearing' | 'speech' | null
  city: text("city").default("Legazpi City"),
  phone: text("phone"),
  bio: text("bio"),
  skills: text("skills").default("[]"), // JSON array of strings
  workPreference: text("work_preference"), // 'full_time' | 'part_time' | 'freelance'
  company: text("company"), // for employers
  createdAt: integer("created_at", { mode: "timestamp" }),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── Jobs ────────────────────────────────────────────────────────────────────

export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employerId: integer("employer_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  company: text("company").notNull(),
  location: text("location").notNull().default("Legazpi City"),
  type: text("type").notNull().default("full_time"), // 'full_time' | 'part_time' | 'freelance'
  requiredSkills: text("required_skills").default("[]"), // JSON array
  salary: text("salary"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  /**
   * assessment — nullable JSON stored as TEXT.
   * Shape: { timer: number, passingScore: number, questions: { question: string, options: string[], correctIndex: number }[] }
   * null means this job has no assessment requirement.
   */
  assessment: text("assessment"),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
});
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

// ─── Assessments (seeker platform assessments) ────────────────────────────────

export const assessments = sqliteTable("assessments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  category: text("category").notNull(), // 'computer_literacy' | 'communication' | 'data_entry' | 'problem_solving'
  score: integer("score").notNull(), // 0-100
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  completedAt: true,
});
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;

// ─── Job Assessment Results ───────────────────────────────────────────────────
// Stores the result of a seeker taking an employer's job-specific assessment.

export const jobAssessmentResults = sqliteTable("job_assessment_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: integer("job_id").notNull(),
  seekerId: integer("seeker_id").notNull(),
  score: integer("score").notNull(), // 0-100
  passed: integer("passed", { mode: "boolean" }).notNull().default(false),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const insertJobAssessmentResultSchema = createInsertSchema(jobAssessmentResults).omit({
  id: true,
  completedAt: true,
});
export type InsertJobAssessmentResult = z.infer<typeof insertJobAssessmentResultSchema>;
export type JobAssessmentResult = typeof jobAssessmentResults.$inferSelect;

// ─── Job Matches ──────────────────────────────────────────────────────────────

export const jobMatches = sqliteTable("job_matches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: integer("job_id").notNull(),
  seekerId: integer("seeker_id").notNull(),
  fitScore: integer("fit_score").notNull().default(0), // 0-100
  matchedSkills: text("matched_skills").default("[]"), // JSON array
  status: text("status").notNull().default("pending"), // 'pending' | 'viewed' | 'accepted' | 'rejected' | 'shortlisted'
  createdAt: integer("created_at", { mode: "timestamp" }),
});

export const insertJobMatchSchema = createInsertSchema(jobMatches).omit({
  id: true,
  createdAt: true,
});
export type InsertJobMatch = z.infer<typeof insertJobMatchSchema>;
export type JobMatch = typeof jobMatches.$inferSelect;
