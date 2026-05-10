import {
  type User,
  type InsertUser,
  type Job,
  type InsertJob,
  type Assessment,
  type InsertAssessment,
  type JobMatch,
  type InsertJobMatch,
  type JobAssessmentResult,
  type InsertJobAssessmentResult,
  users,
  jobs,
  assessments,
  jobMatches,
  jobAssessmentResults,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// ─── Initialize Tables ────────────────────────────────────────────────────────

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'pwd_seeker',
    disability_type TEXT,
    city TEXT DEFAULT 'Legazpi City',
    phone TEXT,
    bio TEXT,
    skills TEXT DEFAULT '[]',
    work_preference TEXT,
    company TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employer_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT 'Legazpi City',
    type TEXT NOT NULL DEFAULT 'full_time',
    required_skills TEXT DEFAULT '[]',
    salary TEXT,
    is_active INTEGER DEFAULT 1,
    assessment TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    score INTEGER NOT NULL,
    completed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS job_assessment_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    seeker_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    passed INTEGER NOT NULL DEFAULT 0,
    completed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS job_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    seeker_id INTEGER NOT NULL,
    fit_score INTEGER NOT NULL DEFAULT 0,
    matched_skills TEXT DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER
  );
`);

// Migrate: add assessment column to existing jobs table if it doesn't exist
try {
  sqlite.exec(`ALTER TABLE jobs ADD COLUMN assessment TEXT;`);
} catch (_) {
  // Column already exists — ignore
}

// ─── Storage Interface ────────────────────────────────────────────────────────

export interface IStorage {
  // Users
  getUser(id: number): User | undefined;
  getUserByEmail(email: string): User | undefined;
  createUser(user: InsertUser): User;
  updateUser(id: number, data: Partial<InsertUser>): User | undefined;
  getAllSeekers(): User[];
  getAllEmployers(): User[];

  // Jobs
  getJob(id: number): Job | undefined;
  getJobs(filters?: { type?: string; location?: string; employerId?: number }): Job[];
  createJob(job: InsertJob): Job;
  updateJob(id: number, data: Partial<InsertJob>): Job | undefined;
  deleteJob(id: number): void;
  getEmployerJobs(employerId: number): Job[];

  // Platform Assessments
  getAssessment(id: number): Assessment | undefined;
  getUserAssessments(userId: number): Assessment[];
  createAssessment(assessment: InsertAssessment): Assessment;
  deleteUserCategoryAssessment(userId: number, category: string): void;

  // Job Assessment Results
  getJobAssessmentResult(jobId: number, seekerId: number): JobAssessmentResult | undefined;
  createJobAssessmentResult(result: InsertJobAssessmentResult): JobAssessmentResult;

  // Job Matches
  getMatch(id: number): JobMatch | undefined;
  getSeekerMatches(seekerId: number): JobMatch[];
  getJobMatches(jobId: number): JobMatch[];
  createMatch(match: InsertJobMatch): JobMatch;
  updateMatchStatus(id: number, status: string): JobMatch | undefined;
  deleteMatchesForSeeker(seekerId: number): void;
  deleteMatchesForJob(jobId: number): void;

  // Stats
  getStats(): { totalSeekers: number; totalEmployers: number; totalJobs: number; totalMatches: number; avgFitScore: number };
}

// ─── Database Storage Implementation ─────────────────────────────────────────

export class DatabaseStorage implements IStorage {
  // Users
  getUser(id: number): User | undefined {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  getUserByEmail(email: string): User | undefined {
    return db.select().from(users).where(eq(users.email, email)).get();
  }

  createUser(insertUser: InsertUser): User {
    const data = { ...insertUser, createdAt: new Date() };
    return db.insert(users).values(data).returning().get();
  }

  updateUser(id: number, data: Partial<InsertUser>): User | undefined {
    return db.update(users).set(data).where(eq(users.id, id)).returning().get();
  }

  getAllSeekers(): User[] {
    return db.select().from(users).where(eq(users.role, "pwd_seeker")).all();
  }

  getAllEmployers(): User[] {
    return db.select().from(users).where(eq(users.role, "employer")).all();
  }

  // Jobs
  getJob(id: number): Job | undefined {
    return db.select().from(jobs).where(eq(jobs.id, id)).get();
  }

  getJobs(filters?: { type?: string; location?: string; employerId?: number }): Job[] {
    return db.select().from(jobs).where(eq(jobs.isActive, true)).all();
  }

  createJob(insertJob: InsertJob): Job {
    const data = { ...insertJob, createdAt: new Date() };
    return db.insert(jobs).values(data).returning().get();
  }

  updateJob(id: number, data: Partial<InsertJob>): Job | undefined {
    return db.update(jobs).set(data).where(eq(jobs.id, id)).returning().get();
  }

  deleteJob(id: number): void {
    db.delete(jobs).where(eq(jobs.id, id)).run();
  }

  getEmployerJobs(employerId: number): Job[] {
    return db.select().from(jobs).where(eq(jobs.employerId, employerId)).all();
  }

  // Platform Assessments
  getAssessment(id: number): Assessment | undefined {
    return db.select().from(assessments).where(eq(assessments.id, id)).get();
  }

  getUserAssessments(userId: number): Assessment[] {
    return db.select().from(assessments).where(eq(assessments.userId, userId)).all();
  }

  createAssessment(insertAssessment: InsertAssessment): Assessment {
    const data = { ...insertAssessment, completedAt: new Date() };
    return db.insert(assessments).values(data).returning().get();
  }

  deleteUserCategoryAssessment(userId: number, category: string): void {
    db.delete(assessments)
      .where(and(eq(assessments.userId, userId), eq(assessments.category, category)))
      .run();
  }

  // Job Assessment Results
  getJobAssessmentResult(jobId: number, seekerId: number): JobAssessmentResult | undefined {
    return db.select().from(jobAssessmentResults)
      .where(and(eq(jobAssessmentResults.jobId, jobId), eq(jobAssessmentResults.seekerId, seekerId)))
      .get();
  }

  createJobAssessmentResult(result: InsertJobAssessmentResult): JobAssessmentResult {
    const data = { ...result, completedAt: new Date() };
    return db.insert(jobAssessmentResults).values(data).returning().get();
  }

  // Job Matches
  getMatch(id: number): JobMatch | undefined {
    return db.select().from(jobMatches).where(eq(jobMatches.id, id)).get();
  }

  getSeekerMatches(seekerId: number): JobMatch[] {
    return db.select().from(jobMatches).where(eq(jobMatches.seekerId, seekerId)).all();
  }

  getJobMatches(jobId: number): JobMatch[] {
    return db.select().from(jobMatches).where(eq(jobMatches.jobId, jobId)).all();
  }

  createMatch(insertMatch: InsertJobMatch): JobMatch {
    const data = { ...insertMatch, createdAt: new Date() };
    return db.insert(jobMatches).values(data).returning().get();
  }

  updateMatchStatus(id: number, status: string): JobMatch | undefined {
    return db.update(jobMatches).set({ status }).where(eq(jobMatches.id, id)).returning().get();
  }

  deleteMatchesForSeeker(seekerId: number): void {
    db.delete(jobMatches).where(eq(jobMatches.seekerId, seekerId)).run();
  }

  deleteMatchesForJob(jobId: number): void {
    db.delete(jobMatches).where(eq(jobMatches.jobId, jobId)).run();
  }

  // Stats
  getStats() {
    const allSeekers = db.select().from(users).where(eq(users.role, "pwd_seeker")).all();
    const allEmployers = db.select().from(users).where(eq(users.role, "employer")).all();
    const allJobs = db.select().from(jobs).all();
    const allMatches = db.select().from(jobMatches).all();
    const avgFitScore = allMatches.length > 0
      ? Math.round(allMatches.reduce((sum, m) => sum + m.fitScore, 0) / allMatches.length)
      : 0;
    return {
      totalSeekers: allSeekers.length,
      totalEmployers: allEmployers.length,
      totalJobs: allJobs.length,
      totalMatches: allMatches.length,
      avgFitScore,
    };
  }
}

export const storage = new DatabaseStorage();
