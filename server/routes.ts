import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./storage";
import { users, jobs, assessments, jobMatches } from "@shared/schema";

// ─── Skill-Based Matching Algorithm ──────────────────────────────────────────

function computeMatch(
  seekerSkills: string[],
  assessmentScores: { category: string; score: number }[],
  job: { requiredSkills: string; location: string; type: string },
  seekerLocation: string,
  seekerWorkPreference: string | null
): { fitScore: number; matchedSkills: string[] } {
  const requiredSkills: string[] = JSON.parse(job.requiredSkills || "[]");
  const seeker: string[] = seekerSkills.map((s) => s.toLowerCase().trim());

  if (requiredSkills.length === 0) return { fitScore: 0, matchedSkills: [] };

  // Expand seeker skills with assessment categories if scores >= 60
  const expandedSkills = [...seeker];
  for (const as of assessmentScores) {
    if (as.score >= 60) {
      const categorySkills: Record<string, string[]> = {
        computer_literacy: ["computer literacy", "ms office", "typing", "email", "internet browsing"],
        communication: ["communication", "writing", "customer service"],
        data_entry: ["data entry", "spreadsheets", "accuracy", "typing"],
        problem_solving: ["problem solving", "critical thinking", "analysis"],
      };
      const extras = categorySkills[as.category] || [];
      expandedSkills.push(...extras);
    }
  }

  const matchedSkills = requiredSkills.filter((req) =>
    expandedSkills.some((s) => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))
  );

  let fitScore = Math.round((matchedSkills.length / requiredSkills.length) * 100);

  // Bonus points (blind matching — NO disability type considered)
  if (seekerLocation?.toLowerCase() === job.location?.toLowerCase()) fitScore += 10;
  if (seekerWorkPreference && seekerWorkPreference === job.type) fitScore += 5;

  fitScore = Math.min(100, fitScore);
  return { fitScore, matchedSkills };
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

async function seedDatabase() {
  const existingUsers = db.select().from(users).all();
  if (existingUsers.length > 0) return; // Already seeded

  console.log("Seeding database with sample data...");
  const now = new Date();

  // Employers
  const emp1 = storage.createUser({
    email: "hr@bicolmedical.com",
    password: "password123",
    name: "Maria Santos",
    role: "employer",
    company: "Bicol Medical Center",
    city: "Legazpi City",
    phone: "09171234567",
    bio: "Leading healthcare provider in Bicol Region.",
    skills: "[]",
    workPreference: null,
    disabilityType: null,
  });

  const emp2 = storage.createUser({
    email: "admin@albaycraft.com",
    password: "password123",
    name: "Jose Reyes",
    role: "employer",
    company: "Albay Craft & Design Co.",
    city: "Legazpi City",
    phone: "09181234567",
    bio: "Local crafts and handicraft manufacturing.",
    skills: "[]",
    workPreference: null,
    disabilityType: null,
  });

  const emp3 = storage.createUser({
    email: "hr@bicolbpo.com",
    password: "password123",
    name: "Ana Villanueva",
    role: "employer",
    company: "Bicol BPO Solutions",
    city: "Legazpi City",
    phone: "09191234567",
    bio: "Business process outsourcing services company.",
    skills: "[]",
    workPreference: null,
    disabilityType: null,
  });

  // PWD Seekers
  const seeker1 = storage.createUser({
    email: "juan.delacruiz@email.com",
    password: "password123",
    name: "Juan Dela Cruz",
    role: "pwd_seeker",
    disabilityType: "visual",
    city: "Legazpi City",
    phone: "09221234567",
    bio: "Experienced data encoder with strong attention to detail. I work best with screen readers and assistive technology.",
    skills: JSON.stringify(["data entry", "typing", "ms office", "spreadsheets", "email"]),
    workPreference: "full_time",
    company: null,
  });

  const seeker2 = storage.createUser({
    email: "rosa.garcia@email.com",
    password: "password123",
    name: "Rosa Garcia",
    role: "pwd_seeker",
    disabilityType: "hearing",
    city: "Legazpi City",
    phone: "09231234567",
    bio: "Graphic artist and computer literate professional with excellent attention to visual detail.",
    skills: JSON.stringify(["computer literacy", "graphic design", "communication", "customer service", "internet browsing"]),
    workPreference: "part_time",
    company: null,
  });

  // Jobs
  const job1 = storage.createJob({
    employerId: emp3.id,
    title: "Data Entry Specialist",
    description: "We are looking for a detail-oriented Data Entry Specialist to join our BPO team. You will be responsible for accurately entering data into our systems, maintaining spreadsheets, and ensuring data quality. Flexible working arrangements available for PWD applicants. Screen reader-compatible workstation provided.",
    company: "Bicol BPO Solutions",
    location: "Legazpi City",
    type: "full_time",
    requiredSkills: JSON.stringify(["data entry", "typing", "spreadsheets", "ms office", "accuracy"]),
    salary: "₱15,000 - ₱18,000 per month",
    isActive: true,
  });

  const job2 = storage.createJob({
    employerId: emp1.id,
    title: "Medical Records Encoder",
    description: "Bicol Medical Center is seeking a Medical Records Encoder to manage patient records and data. The role involves data entry, file management, and coordination with the medical team. Accessible workplace with all necessary accommodations.",
    company: "Bicol Medical Center",
    location: "Legazpi City",
    type: "full_time",
    requiredSkills: JSON.stringify(["data entry", "ms office", "typing", "communication", "accuracy"]),
    salary: "₱14,000 - ₱17,000 per month",
    isActive: true,
  });

  const job3 = storage.createJob({
    employerId: emp2.id,
    title: "Design Assistant (Part-time)",
    description: "Albay Craft & Design Co. needs a creative Design Assistant. Tasks include computer-aided design work, pattern creation, and digital asset management. Part-time with flexible hours for PWD applicants.",
    company: "Albay Craft & Design Co.",
    location: "Legazpi City",
    type: "part_time",
    requiredSkills: JSON.stringify(["computer literacy", "graphic design", "communication", "internet browsing"]),
    salary: "₱8,000 - ₱10,000 per month",
    isActive: true,
  });

  const job4 = storage.createJob({
    employerId: emp3.id,
    title: "Customer Support Representative",
    description: "Join our customer support team! You will handle customer inquiries via chat and email, solve problems, and ensure customer satisfaction. Training provided. Assistive technology available.",
    company: "Bicol BPO Solutions",
    location: "Legazpi City",
    type: "full_time",
    requiredSkills: JSON.stringify(["customer service", "communication", "computer literacy", "problem solving", "typing"]),
    salary: "₱16,000 - ₱20,000 per month",
    isActive: true,
  });

  const job5 = storage.createJob({
    employerId: emp2.id,
    title: "Online Product Cataloguer",
    description: "Manage online product listings, create product descriptions, and maintain our e-commerce catalog. Work from home option available. Perfect for detail-oriented individuals with computer skills.",
    company: "Albay Craft & Design Co.",
    location: "Legazpi City",
    type: "freelance",
    requiredSkills: JSON.stringify(["computer literacy", "ms office", "internet browsing", "data entry", "writing"]),
    salary: "₱500 - ₱700 per day",
    isActive: true,
  });

  // Assessment scores for seeker1
  storage.createAssessment({ userId: seeker1.id, category: "computer_literacy", score: 80 });
  storage.createAssessment({ userId: seeker1.id, category: "data_entry", score: 92 });
  storage.createAssessment({ userId: seeker1.id, category: "communication", score: 65 });
  storage.createAssessment({ userId: seeker1.id, category: "problem_solving", score: 70 });

  // Assessment scores for seeker2
  storage.createAssessment({ userId: seeker2.id, category: "computer_literacy", score: 88 });
  storage.createAssessment({ userId: seeker2.id, category: "communication", score: 75 });

  // Compute and store matches for seeker1
  const seeker1Skills: string[] = JSON.parse(seeker1.skills || "[]");
  const seeker1Assessments = storage.getUserAssessments(seeker1.id);
  const allActiveJobs = storage.getJobs();
  
  for (const job of allActiveJobs) {
    const { fitScore, matchedSkills } = computeMatch(
      seeker1Skills,
      seeker1Assessments.map((a) => ({ category: a.category, score: a.score })),
      { requiredSkills: job.requiredSkills || "[]", location: job.location, type: job.type },
      seeker1.city || "Legazpi City",
      seeker1.workPreference || null
    );
    if (fitScore >= 40) {
      storage.createMatch({
        jobId: job.id,
        seekerId: seeker1.id,
        fitScore,
        matchedSkills: JSON.stringify(matchedSkills),
        status: "pending",
      });
    }
  }

  // Compute and store matches for seeker2
  const seeker2Skills: string[] = JSON.parse(seeker2.skills || "[]");
  const seeker2Assessments = storage.getUserAssessments(seeker2.id);
  
  for (const job of allActiveJobs) {
    const { fitScore, matchedSkills } = computeMatch(
      seeker2Skills,
      seeker2Assessments.map((a) => ({ category: a.category, score: a.score })),
      { requiredSkills: job.requiredSkills || "[]", location: job.location, type: job.type },
      seeker2.city || "Legazpi City",
      seeker2.workPreference || null
    );
    if (fitScore >= 40) {
      storage.createMatch({
        jobId: job.id,
        seekerId: seeker2.id,
        fitScore,
        matchedSkills: JSON.stringify(matchedSkills),
        status: "pending",
      });
    }
  }

  console.log("Database seeded successfully!");
}

// Run seeding
seedDatabase().catch(console.error);

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Auth ──────────────────────────────────────────────────────────────────

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, role, disabilityType, skills, workPreference, city, phone, bio, company } = req.body;
      
      if (!email || !password || !name || !role) {
        return res.status(400).json({ error: "Email, password, name, and role are required" });
      }

      const existing = storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const user = storage.createUser({
        email,
        password, // In production, hash this
        name,
        role,
        disabilityType: disabilityType || null,
        skills: skills ? JSON.stringify(skills) : "[]",
        workPreference: workPreference || null,
        city: city || "Legazpi City",
        phone: phone || null,
        bio: bio || null,
        company: company || null,
      });

      const { password: _, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const { password: _, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = req.headers["x-user-id"];
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const user = storage.getUser(Number(userId));
    if (!user) return res.status(404).json({ error: "User not found" });

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser });
  });

  // ── Users ─────────────────────────────────────────────────────────────────

  app.get("/api/users/:id", async (req, res) => {
    const user = storage.getUser(Number(req.params.id));
    if (!user) return res.status(404).json({ error: "User not found" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const { skills, ...rest } = req.body;
      const updateData: any = { ...rest };
      if (skills !== undefined) {
        updateData.skills = Array.isArray(skills) ? JSON.stringify(skills) : skills;
      }
      const user = storage.updateUser(Number(req.params.id), updateData);
      if (!user) return res.status(404).json({ error: "User not found" });
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ── Jobs ──────────────────────────────────────────────────────────────────

  app.get("/api/jobs", async (req, res) => {
    const allJobs = storage.getJobs();
    // Parse requiredSkills for each job
    const jobsWithParsed = allJobs.map((j) => ({
      ...j,
      requiredSkills: JSON.parse(j.requiredSkills || "[]"),
    }));
    res.json(jobsWithParsed);
  });

  app.get("/api/jobs/:id", async (req, res) => {
    const job = storage.getJob(Number(req.params.id));
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ ...job, requiredSkills: JSON.parse(job.requiredSkills || "[]") });
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      const { employerId, title, description, company, location, type, requiredSkills, salary } = req.body;
      if (!employerId || !title || !description || !company) {
        return res.status(400).json({ error: "Required fields missing" });
      }

      const job = storage.createJob({
        employerId: Number(employerId),
        title,
        description,
        company,
        location: location || "Legazpi City",
        type: type || "full_time",
        requiredSkills: Array.isArray(requiredSkills) ? JSON.stringify(requiredSkills) : (requiredSkills || "[]"),
        salary: salary || null,
        isActive: true,
      });

      // Run matching algorithm for all seekers
      const allSeekers = storage.getAllSeekers();
      for (const seeker of allSeekers) {
        const seekerSkills: string[] = JSON.parse(seeker.skills || "[]");
        const seekerAssessments = storage.getUserAssessments(seeker.id);
        const { fitScore, matchedSkills } = computeMatch(
          seekerSkills,
          seekerAssessments.map((a) => ({ category: a.category, score: a.score })),
          { requiredSkills: job.requiredSkills || "[]", location: job.location, type: job.type },
          seeker.city || "Legazpi City",
          seeker.workPreference || null
        );
        if (fitScore >= 40) {
          storage.createMatch({
            jobId: job.id,
            seekerId: seeker.id,
            fitScore,
            matchedSkills: JSON.stringify(matchedSkills),
            status: "pending",
          });
        }
      }

      res.json({ ...job, requiredSkills: JSON.parse(job.requiredSkills || "[]") });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/jobs/:id", async (req, res) => {
    try {
      const { requiredSkills, ...rest } = req.body;
      const updateData: any = { ...rest };
      if (requiredSkills !== undefined) {
        updateData.requiredSkills = Array.isArray(requiredSkills) ? JSON.stringify(requiredSkills) : requiredSkills;
      }
      const job = storage.updateJob(Number(req.params.id), updateData);
      if (!job) return res.status(404).json({ error: "Job not found" });
      res.json({ ...job, requiredSkills: JSON.parse(job.requiredSkills || "[]") });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/jobs/:id", async (req, res) => {
    storage.deleteMatchesForJob(Number(req.params.id));
    storage.deleteJob(Number(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/employer/:id/jobs", async (req, res) => {
    const employerJobs = storage.getEmployerJobs(Number(req.params.id));
    const jobsWithParsed = employerJobs.map((j) => ({
      ...j,
      requiredSkills: JSON.parse(j.requiredSkills || "[]"),
    }));
    res.json(jobsWithParsed);
  });

  // ── Assessments ───────────────────────────────────────────────────────────

  app.post("/api/assessments", async (req, res) => {
    try {
      const { userId, category, score } = req.body;
      if (!userId || !category || score === undefined) {
        return res.status(400).json({ error: "userId, category, and score are required" });
      }

      // Delete existing assessment for same category before creating new one
      storage.deleteUserCategoryAssessment(Number(userId), category);
      
      const assessment = storage.createAssessment({
        userId: Number(userId),
        category,
        score: Number(score),
      });

      // Regenerate matches for this seeker with updated assessment
      const seeker = storage.getUser(Number(userId));
      if (seeker) {
        const seekerSkills: string[] = JSON.parse(seeker.skills || "[]");
        const seekerAssessments = storage.getUserAssessments(Number(userId));
        
        // Clear old matches and regenerate
        storage.deleteMatchesForSeeker(Number(userId));
        const allJobs = storage.getJobs();
        for (const job of allJobs) {
          const { fitScore, matchedSkills } = computeMatch(
            seekerSkills,
            seekerAssessments.map((a) => ({ category: a.category, score: a.score })),
            { requiredSkills: job.requiredSkills || "[]", location: job.location, type: job.type },
            seeker.city || "Legazpi City",
            seeker.workPreference || null
          );
          if (fitScore >= 40) {
            storage.createMatch({
              jobId: job.id,
              seekerId: seeker.id,
              fitScore,
              matchedSkills: JSON.stringify(matchedSkills),
              status: "pending",
            });
          }
        }
      }

      res.json(assessment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/assessments/:userId", async (req, res) => {
    const userAssessments = storage.getUserAssessments(Number(req.params.userId));
    res.json(userAssessments);
  });

  // ── Matches ───────────────────────────────────────────────────────────────

  app.get("/api/matches/seeker/:userId", async (req, res) => {
    const matches = storage.getSeekerMatches(Number(req.params.userId));
    // Enrich with job data
    const enriched = matches.map((m) => {
      const job = storage.getJob(m.jobId);
      return {
        ...m,
        matchedSkills: JSON.parse(m.matchedSkills || "[]"),
        job: job ? { ...job, requiredSkills: JSON.parse(job.requiredSkills || "[]") } : null,
      };
    }).filter((m) => m.job !== null)
      .sort((a, b) => b.fitScore - a.fitScore);
    res.json(enriched);
  });

  app.get("/api/matches/job/:jobId", async (req, res) => {
    const matches = storage.getJobMatches(Number(req.params.jobId));
    // Enrich with seeker data (BLIND — no disability info)
    const enriched = matches.map((m) => {
      const seeker = storage.getUser(m.seekerId);
      if (!seeker) return null;
      return {
        ...m,
        matchedSkills: JSON.parse(m.matchedSkills || "[]"),
        seeker: {
          id: seeker.id,
          name: seeker.name,
          city: seeker.city,
          workPreference: seeker.workPreference,
          skills: JSON.parse(seeker.skills || "[]"),
          // disabilityType is intentionally excluded for blind matching
        },
        assessments: storage.getUserAssessments(seeker.id),
      };
    }).filter(Boolean)
      .sort((a: any, b: any) => b.fitScore - a.fitScore);
    res.json(enriched);
  });

  app.post("/api/matches/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const match = storage.updateMatchStatus(Number(req.params.id), status);
      if (!match) return res.status(404).json({ error: "Match not found" });
      res.json(match);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Run match algorithm for a seeker manually
  app.post("/api/matches/generate/:userId", async (req, res) => {
    try {
      const seeker = storage.getUser(Number(req.params.userId));
      if (!seeker) return res.status(404).json({ error: "User not found" });

      const seekerSkills: string[] = JSON.parse(seeker.skills || "[]");
      const seekerAssessments = storage.getUserAssessments(seeker.id);
      
      storage.deleteMatchesForSeeker(seeker.id);
      const allJobs = storage.getJobs();
      const newMatches = [];
      
      for (const job of allJobs) {
        const { fitScore, matchedSkills } = computeMatch(
          seekerSkills,
          seekerAssessments.map((a) => ({ category: a.category, score: a.score })),
          { requiredSkills: job.requiredSkills || "[]", location: job.location, type: job.type },
          seeker.city || "Legazpi City",
          seeker.workPreference || null
        );
        if (fitScore >= 40) {
          const match = storage.createMatch({
            jobId: job.id,
            seekerId: seeker.id,
            fitScore,
            matchedSkills: JSON.stringify(matchedSkills),
            status: "pending",
          });
          newMatches.push(match);
        }
      }
      
      res.json({ matches: newMatches.length, generated: newMatches });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ── Stats ─────────────────────────────────────────────────────────────────

  app.get("/api/stats", async (req, res) => {
    const stats = storage.getStats();
    res.json(stats);
  });

  return httpServer;
}
