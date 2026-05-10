import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Monitor, MessageSquare, Database, Brain,
  CheckCircle2, XCircle, Clock, ArrowRight, ArrowLeft,
  RotateCcw, Award, AlertTriangle,
} from "lucide-react";

const CATEGORIES = [
  {
    id: "computer_literacy",
    label: "Computer Literacy",
    icon: <Monitor size={24} />,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    questions: [
      {
        q: "What does 'URL' stand for?",
        options: ["Uniform Resource Locator", "Universal Resource Link", "Unified Remote Library", "Unique Reference Location"],
        correct: 0,
      },
      {
        q: "Which key combination copies selected text?",
        options: ["Ctrl+V", "Ctrl+X", "Ctrl+C", "Ctrl+A"],
        correct: 2,
      },
      {
        q: "What is the main function of an operating system?",
        options: [
          "Browse the internet",
          "Manage computer hardware and software",
          "Create documents",
          "Play multimedia files",
        ],
        correct: 1,
      },
      {
        q: "Which file format is commonly used for text documents?",
        options: [".jpg", ".mp4", ".docx", ".exe"],
        correct: 2,
      },
      {
        q: "What does 'RAM' stand for?",
        options: ["Read Accessible Memory", "Random Access Memory", "Rapid Application Module", "Remote Access Management"],
        correct: 1,
      },
    ],
  },
  {
    id: "communication",
    label: "Communication Skills",
    icon: <MessageSquare size={24} />,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/10",
    questions: [
      {
        q: "What is the most important aspect of a professional email?",
        options: ["Fancy formatting", "Clear and concise subject line", "Long detailed explanation", "Multiple attachments"],
        correct: 1,
      },
      {
        q: "Which is the best practice for workplace communication?",
        options: [
          "Speak as fast as possible",
          "Use only technical jargon",
          "Listen actively and respond thoughtfully",
          "Avoid asking questions",
        ],
        correct: 2,
      },
      {
        q: "What does non-verbal communication include?",
        options: [
          "Only written messages",
          "Only phone calls",
          "Body language, facial expressions, and gestures",
          "Only emails",
        ],
        correct: 2,
      },
      {
        q: "When writing a business letter, you should...",
        options: [
          "Use casual language and contractions",
          "Include jokes to lighten the mood",
          "Use formal language and proper formatting",
          "Write in all capital letters",
        ],
        correct: 2,
      },
      {
        q: "Active listening involves...",
        options: [
          "Planning your response while others speak",
          "Checking your phone periodically",
          "Paying full attention and providing feedback",
          "Interrupting to share your ideas",
        ],
        correct: 2,
      },
    ],
  },
  {
    id: "data_entry",
    label: "Data Entry & Accuracy",
    icon: <Database size={24} />,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
    questions: [
      {
        q: "What is the most important quality in data entry work?",
        options: ["Speed above all else", "Accuracy and attention to detail", "Using complex formulas", "Working without supervision"],
        correct: 1,
      },
      {
        q: "Which tool is best for organizing numerical data?",
        options: ["Word processor", "Presentation software", "Spreadsheet software", "Email client"],
        correct: 2,
      },
      {
        q: "Before submitting entered data, you should...",
        options: [
          "Send it immediately",
          "Ask someone else to enter it",
          "Double-check all entries for errors",
          "Delete and re-enter everything",
        ],
        correct: 2,
      },
      {
        q: "What does 'validation' mean in data entry?",
        options: [
          "Deleting incorrect entries",
          "Checking if entered data meets required format",
          "Printing the data",
          "Sharing the data with others",
        ],
        correct: 1,
      },
      {
        q: "Which keyboard shortcut quickly saves your work?",
        options: ["Ctrl+P", "Ctrl+Z", "Ctrl+S", "Ctrl+F"],
        correct: 2,
      },
    ],
  },
  {
    id: "problem_solving",
    label: "Problem Solving",
    icon: <Brain size={24} />,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    questions: [
      {
        q: "What is the first step in solving any problem?",
        options: [
          "Implement the solution immediately",
          "Ask someone else to solve it",
          "Identify and understand the problem",
          "Accept that it cannot be solved",
        ],
        correct: 2,
      },
      {
        q: "Critical thinking involves...",
        options: [
          "Accepting all information as true",
          "Analyzing information objectively before making decisions",
          "Following instructions without question",
          "Avoiding complex situations",
        ],
        correct: 1,
      },
      {
        q: "When facing a complex task, the best approach is...",
        options: [
          "Tackle everything at once",
          "Give up and seek help immediately",
          "Break it into smaller manageable parts",
          "Wait for someone to guide you",
        ],
        correct: 2,
      },
      {
        q: "What should you do when you encounter an error?",
        options: [
          "Ignore it and continue",
          "Review the steps and identify where it occurred",
          "Start over from scratch",
          "Blame external factors",
        ],
        correct: 1,
      },
      {
        q: "Time management is important because...",
        options: [
          "It eliminates the need for breaks",
          "It helps prioritize tasks and meet deadlines",
          "It means working longer hours",
          "It avoids all mistakes",
        ],
        correct: 1,
      },
    ],
  },
];

const TIMER_SECONDS = 300; // 5 minutes per category

interface Assessment {
  id: number;
  category: string;
  score: number;
}

export default function SeekerAssessment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [extendedTime, setExtendedTime] = useState(false);

  const { data: existingAssessments, isLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/assessments/${user?.id}`);
      return res.json();
    },
    enabled: !!user?.id,
  });

  const submitMutation = useMutation({
    mutationFn: async ({ category, score }: { category: string; score: number }) => {
      const res = await apiRequest("POST", "/api/assessments", {
        userId: user?.id,
        category,
        score,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/matches/seeker", user?.id] });
      toast({
        title: "Assessment Submitted",
        description: "Your results have been saved and matches have been updated.",
      });
    },
  });

  // Timer
  useEffect(() => {
    if (!activeCategory || submitted) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [activeCategory, submitted, timeLeft]);

  const category = CATEGORIES.find((c) => c.id === activeCategory);
  const questions = category?.questions || [];

  const startCategory = (catId: string) => {
    setActiveCategory(catId);
    setCurrentQ(0);
    setAnswers(new Array(CATEGORIES.find((c) => c.id === catId)?.questions.length || 5).fill(null));
    setSubmitted(false);
    setTimeLeft(extendedTime ? TIMER_SECONDS * 2 : TIMER_SECONDS);
  };

  const selectAnswer = (answerIdx: number) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[currentQ] = answerIdx;
    setAnswers(newAnswers);
  };

  const handleSubmit = useCallback(() => {
    if (!activeCategory || !category) return;
    setSubmitted(true);
    const correctCount = answers.filter((a, i) => a === questions[i]?.correct).length;
    const score = Math.round((correctCount / questions.length) * 100);
    submitMutation.mutate({ category: activeCategory, score });
  }, [activeCategory, answers, questions, category]);

  const exitAssessment = () => {
    setActiveCategory(null);
    setSubmitted(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const correctCount = submitted
    ? answers.filter((a, i) => a === questions[i]?.correct).length
    : 0;
  const score = submitted ? Math.round((correctCount / questions.length) * 100) : 0;

  // Category selection view
  if (!activeCategory) {
    return (
      <DashboardLayout title="Skills Assessment">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
            <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Award size={18} className="text-primary" aria-hidden="true" />
              About the Assessment
            </h2>
            <p className="text-sm text-muted-foreground">
              Complete skill assessments to verify your abilities. Scores of 60% or above add verified skills to your
              profile and boost your job match scores. Each test has 5 questions with a 5-minute timer.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={extendedTime}
                  onChange={(e) => setExtendedTime(e.target.checked)}
                  className="rounded border-input"
                  aria-label="Enable extended time accommodation (10 minutes instead of 5)"
                  data-testid="checkbox-extended-time"
                />
                Extended time accommodation (10 minutes)
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CATEGORIES.map((cat) => {
              const existing = existingAssessments?.find((a) => a.category === cat.id);
              return (
                <div
                  key={cat.id}
                  className="bg-card border border-border/60 rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all"
                  role="article"
                  data-testid={`card-category-${cat.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${cat.bg} ${cat.color}`} aria-hidden="true">
                      {cat.icon}
                    </div>
                    {existing ? (
                      <div className="text-right">
                        <div className={`text-2xl font-bold tabular-nums ${
                          existing.score >= 80 ? "text-green-600 dark:text-green-400" :
                          existing.score >= 60 ? "text-primary" : "text-amber-600 dark:text-amber-400"
                        }`} data-testid={`text-score-${cat.id}`}>
                          {existing.score}%
                        </div>
                        <div className="text-xs text-muted-foreground">Last score</div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Not taken
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{cat.label}</h3>
                  <p className="text-xs text-muted-foreground mb-1">5 questions · {extendedTime ? "10" : "5"} minutes</p>
                  {existing && (
                    <Progress value={existing.score} className="h-1 mb-3" aria-label={`Current score: ${existing.score}%`} />
                  )}
                  <Button
                    className="w-full mt-3 gap-2 text-sm"
                    size="sm"
                    onClick={() => startCategory(cat.id)}
                    data-testid={`button-start-${cat.id}`}
                    aria-label={`Start ${cat.label} assessment`}
                  >
                    {existing ? <><RotateCcw size={14} aria-hidden="true" /> Retake</> : <><ArrowRight size={14} aria-hidden="true" /> Start</>}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const q = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

  // Results view
  if (submitted) {
    return (
      <DashboardLayout title="Assessment Results">
        <div className="max-w-xl mx-auto">
          <div className="bg-card border border-border/60 rounded-2xl p-8 text-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                score >= 60 ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 dark:bg-amber-900/30"
              }`}
              aria-hidden="true"
            >
              {score >= 60 ? (
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              )}
            </div>

            <h2
              className="text-2xl font-bold text-foreground mb-2"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
              data-testid="text-assessment-score"
            >
              {score}%
            </h2>
            <p className="text-muted-foreground mb-1">
              {correctCount} of {questions.length} questions correct
            </p>
            <p className="text-lg font-semibold text-foreground mb-6">
              {score >= 80
                ? "Excellent! 🎉"
                : score >= 60
                ? "Great job! ✓"
                : "Keep practicing!"}
            </p>

            {score >= 60 ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                  ✓ Verified skills added to your profile
                </p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                  These skills now boost your job match scores automatically.
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                  Score below 60% — skills not added this time
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                  Review the material and retake to earn verified skill credits.
                </p>
              </div>
            )}

            {/* Answer Review */}
            <div className="space-y-3 text-left mb-6" aria-label="Question review">
              {questions.map((question, idx) => {
                const isCorrect = answers[idx] === question.correct;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-sm ${
                      isCorrect
                        ? "border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800"
                        : "border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800"
                    }`}
                    role="listitem"
                  >
                    <div className="flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle2 size={16} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-label="Correct" />
                      ) : (
                        <XCircle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-label="Incorrect" />
                      )}
                      <div>
                        <p className="font-medium text-foreground text-xs">{question.q}</p>
                        {!isCorrect && (
                          <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                            Correct: {question.options[question.correct]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => startCategory(activeCategory)}
                data-testid="button-retake"
              >
                <RotateCcw size={14} aria-hidden="true" /> Retake
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={exitAssessment}
                data-testid="button-back-to-categories"
              >
                All Assessments <ArrowRight size={14} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Active quiz view
  return (
    <DashboardLayout title={category?.label || "Assessment"}>
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${category?.bg} ${category?.color}`} aria-hidden="true">
                {category?.icon}
              </div>
              <span className="font-semibold text-foreground text-sm">{category?.label}</span>
            </div>
            <div
              className={`flex items-center gap-1.5 text-sm font-mono font-medium ${
                timeLeft <= 60 ? "text-red-600 dark:text-red-400 timer-warning" : "text-foreground"
              }`}
              aria-live="polite"
              aria-label={`Time remaining: ${formatTime(timeLeft)}`}
              data-testid="text-timer"
            >
              <Clock size={14} aria-hidden="true" />
              {formatTime(timeLeft)}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Question {currentQ + 1} of {questions.length}</span>
            <span>{answers.filter((a) => a !== null).length} answered</span>
          </div>
          <Progress value={progress} className="h-2" aria-label={`Progress: question ${currentQ + 1} of ${questions.length}`} />
        </div>

        {/* Question */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 mb-4">
          <h2
            className="text-base font-semibold text-foreground mb-6 leading-relaxed"
            id={`question-${currentQ}`}
          >
            {q.q}
          </h2>

          <div
            className="space-y-3"
            role="radiogroup"
            aria-labelledby={`question-${currentQ}`}
          >
            {q.options.map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectAnswer(idx)}
                role="radio"
                aria-checked={answers[currentQ] === idx}
                data-testid={`button-answer-${idx}`}
                className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-xl border-2 text-left text-sm transition-all ${
                  answers[currentQ] === idx
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border hover:border-primary/40 text-foreground"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${
                    answers[currentQ] === idx
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                  aria-hidden="true"
                >
                  {answers[currentQ] === idx && (
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
                <span>{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={exitAssessment}
            className="gap-2 text-sm"
            data-testid="button-exit-assessment"
          >
            Exit
          </Button>
          <div className="flex-1 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
              disabled={currentQ === 0}
              className="flex-1 gap-2 text-sm"
              data-testid="button-prev-question"
              aria-label="Previous question"
            >
              <ArrowLeft size={14} aria-hidden="true" /> Previous
            </Button>
            {currentQ < questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQ((q) => Math.min(questions.length - 1, q + 1))}
                className="flex-1 gap-2 text-sm"
                data-testid="button-next-question"
                aria-label="Next question"
              >
                Next <ArrowRight size={14} aria-hidden="true" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={answers.some((a) => a === null) || submitMutation.isPending}
                className="flex-1 gap-2 text-sm"
                data-testid="button-submit-assessment"
                aria-label="Submit assessment"
              >
                {submitMutation.isPending ? (
                  <><span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" aria-hidden="true" /> Submitting...</>
                ) : (
                  <><CheckCircle2 size={14} aria-hidden="true" /> Submit</>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Question dots */}
        <div className="flex justify-center gap-1.5 mt-4" role="list" aria-label="Question navigation">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentQ(idx)}
              role="listitem"
              aria-label={`Go to question ${idx + 1}${answers[idx] !== null ? " (answered)" : ""}`}
              data-testid={`button-question-dot-${idx}`}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === currentQ
                  ? "bg-primary w-5"
                  : answers[idx] !== null
                  ? "bg-primary/40"
                  : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
