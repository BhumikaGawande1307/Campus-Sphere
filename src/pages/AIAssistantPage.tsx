import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { aiService } from '../services/aiService';
import { studentService } from '../services/studentService';
import { AISkillGapAnalysis, CareerActionItem, StudentProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import {
  Bot,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Award,
  Calendar,
  ArrowRight,
  Cpu,
  Layers,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  ExternalLink,
  DollarSign,
  Briefcase,
  Target,
  Zap,
} from 'lucide-react';

const TARGET_ROLES = [
  'Full-Stack Developer',
  'Data Scientist',
  'Cloud DevOps Engineer',
  'Cybersecurity Analyst',
  'Mobile Application Developer',
];

const SUGGESTED_PROMPTS = [
  'How can I improve my placement readiness?',
  'What skills should I learn for Full-Stack?',
  'Which scholarships match my profile?',
  'Which featured projects should I build?',
  'Review my verified certificates in vault',
];

export const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState(TARGET_ROLES[0]);
  const [analysis, setAnalysis] = useState<AISkillGapAnalysis | null>(null);
  const [actionPlan, setActionPlan] = useState<CareerActionItem[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [newActionText, setNewActionText] = useState('');
  const toast = useToast();

  // Chat
  const [messages, setMessages] = useState<
    Array<{
      sender: 'ai' | 'user';
      text: string;
      card?: {
        recommendation: string;
        why: string;
        action_label: string;
        action_link?: string;
      };
    }>
  >([
    {
      sender: 'ai',
      text: `Hello, ${user?.first_name || 'Student'}! I am your AI Career Assistant. I have analyzed your courses, certificates, and projects against current industry job requirements. How can I help with your career preparation today?`,
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [asking, setAsking] = useState(false);

  const runAnalysis = async (role: string) => {
    try {
      setLoadingAnalysis(true);
      const [res, profRes] = await Promise.all([
        aiService.getSkillGapAnalysis(role),
        studentService.getMyProfile(),
      ]);
      setAnalysis(res);
      setActionPlan(res.action_plan || []);
      setStudentProfile(profRes);
    } catch {
      toast.error('Failed to run skill analysis');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    runAnalysis(selectedRole);
  }, [selectedRole]);

  const handleAsk = async (textToSend?: string) => {
    const query = textToSend || inputQuestion;
    if (!query.trim()) return;

    const userMsg = query.trim();
    setInputQuestion('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setAsking(true);

    try {
      const res = await aiService.askAssistant(userMsg);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: res.answer,
          card: res.structured_card,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'I encountered an issue analyzing the database records. Please try again.',
        },
      ]);
    } finally {
      setAsking(false);
    }
  };

  const handleToggleAction = async (itemId: string) => {
    try {
      const updated = await aiService.toggleActionItem(itemId);
      setActionPlan(updated.items);
      const item = updated.items.find((i) => i.id === itemId);
      if (item?.is_completed) {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
        toast.success('Action Milestone Completed! 🎉', item.text);
      }
    } catch {
      toast.error('Failed to toggle action item');
    }
  };

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionText.trim()) return;

    try {
      const updated = await aiService.addActionItem(newActionText.trim(), 'GENERAL');
      setActionPlan(updated.items);
      setNewActionText('');
      toast.success('Milestone Added to Career Plan');
    } catch {
      toast.error('Failed to add milestone');
    }
  };

  const handleDeleteAction = async (itemId: string) => {
    try {
      const updated = await aiService.deleteActionItem(itemId);
      setActionPlan(updated.items);
    } catch {
      toast.error('Failed to delete milestone');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Hero Visual Header with AI Pulse */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/10 bg-gradient-to-br from-indigo-900 via-midnight-950 to-blue-950 text-white p-6 sm:p-8 shadow-2xl">
        <div className="absolute inset-0 bg-grid-dots opacity-20 pointer-events-none" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-bold text-blue-300">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                AI Career Intelligence Engine
              </span>
              <span className="text-xs text-slate-300">
                &bull; Real-time Job Requirements
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Your AI Career Assistant
            </h1>
            <p className="text-xs sm:text-sm text-blue-200/80 max-w-xl leading-relaxed">
              Understand your current career readiness, find skill gaps for your target roles, and follow a clear step-by-step action plan.
            </p>
          </div>

          {/* Target Role Selector */}
          <div className="space-y-1.5 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
              Select Target Career Track:
            </span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full sm:w-64 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 backdrop-blur-xl border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {TARGET_ROLES.map((role) => (
                <option key={role} value={role} className="bg-midnight-900 text-white">
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Engine Transparency Notice Banner */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
        <p>
          <span className="font-bold">Rubric-Based Career Benchmarks (Active):</span> Recommendations and competency analyses are computed using university curriculum matrices and verified target-role benchmarks.
        </p>
      </div>

      {/* 2. Main Split-Screen Architecture: Profile & Skill Gap (Left) + AI Chat (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Live Skill Gap Matrix & Placement Readiness */}
        <div className="lg:col-span-5 space-y-6">
          {/* Readiness Meter Card */}
          <Card className="p-6 space-y-4">
            <CardHeader
              title={`Readiness Benchmark: ${selectedRole}`}
              subtitle="Comparing your skills against top job requirements"
            />

            {loadingAnalysis ? (
              <LoadingSkeleton rows={4} />
            ) : analysis ? (
              <div className="space-y-4">
                {/* Master Match Percentage */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-violet-500/10 border border-blue-500/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Target Match Score</span>
                    <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                      {analysis.match_percentage}%
                    </p>
                  </div>
                  <Badge variant={analysis.match_percentage >= 70 ? 'success' : 'warning'} size="md" dot>
                    {analysis.match_percentage >= 70 ? 'Tier-1 Qualified' : 'Action Required'}
                  </Badge>
                </div>

                {/* Possessed Competencies */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Verified Strengths ({analysis.possessed_skills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.possessed_skills.map((s) => (
                      <span
                        key={s}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                      >
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Competencies / Gap */}
                {analysis.missing_skills.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4" />
                      Priority Skill Gaps ({analysis.missing_skills.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.missing_skills.map((s) => (
                        <span
                          key={s}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                        >
                          + {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </Card>

          {/* Persistent Career Action Plan Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Persistent Career Action Plan
                </h3>
                <p className="text-xs text-slate-500">
                  Track weekly milestones to close skill gaps
                </p>
              </div>
              <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">
                {actionPlan.filter((a) => a.is_completed).length} / {actionPlan.length} Done
              </span>
            </div>

            {/* Checklist */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {actionPlan.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start justify-between gap-2.5 p-3 rounded-xl border transition-all ${
                    item.is_completed
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-400'
                      : 'bg-slate-50 dark:bg-midnight-900/60 border-slate-200/80 dark:border-white/5 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <button
                    onClick={() => handleToggleAction(item.id)}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-500 transition-colors"
                  >
                    {item.is_completed ? (
                      <CheckSquare className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>

                  <span
                    className={`text-xs leading-relaxed flex-1 ${
                      item.is_completed ? 'line-through text-slate-400' : 'font-medium'
                    }`}
                  >
                    {item.text}
                  </span>

                  <button
                    onClick={() => handleDeleteAction(item.id)}
                    className="text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                    title="Delete item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Custom Milestone Input */}
            <form onSubmit={handleAddAction} className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <input
                type="text"
                value={newActionText}
                onChange={(e) => setNewActionText(e.target.value)}
                placeholder="Add custom milestone (e.g. Master Docker)..."
                className="flex-1 px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-midnight-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button type="submit" size="sm" variant="secondary" leftIcon={<Plus className="h-3.5 w-3.5" />}>
                Add
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column (7 Cols): Conversational AI Copilot */}
        <Card className="lg:col-span-7 p-6 flex flex-col justify-between min-h-[580px]">
          <div>
            <CardHeader
              title="AI Career Copilot Chat"
              subtitle="Ask questions regarding resume tailoring, scholarship matching, and coursework"
              badge={
                <Badge variant="primary" size="sm" dot>
                  Active Assistant
                </Badge>
              }
            />

            {/* Suggested Prompts Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 border-b border-slate-100 dark:border-white/5 no-scrollbar">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleAsk(prompt)}
                  disabled={asking}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 dark:bg-midnight-800 hover:bg-blue-50 dark:hover:bg-midnight-700 text-slate-700 dark:text-slate-300 shrink-0 border border-slate-200/60 dark:border-white/5 transition-all"
                >
                  💬 {prompt}
                </button>
              ))}
            </div>

            {/* Messages Scroll Area */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    m.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {m.sender === 'ai' && (
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className="space-y-2.5 max-w-[85%]">
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none shadow-md font-medium'
                          : 'bg-slate-50 dark:bg-midnight-900/80 border border-slate-200/80 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {m.text}
                    </div>

                    {/* Structured Response Card */}
                    {m.card && (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-violet-500/10 border border-blue-500/25 space-y-2 animate-in fade-in duration-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                          ⚡ AI Structured Recommendation
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {m.card.recommendation}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {m.card.why}
                        </p>
                        {m.card.action_link && (
                          <Link to={m.card.action_link} className="inline-block pt-1">
                            <Button size="sm" variant="primary" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                              {m.card.action_label}
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {asking && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-midnight-900/80 border border-slate-200/80 dark:border-white/5 text-xs text-slate-400 flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                    Checking profile details & job market requirements...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Bar */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-2">
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAsk();
              }}
              placeholder="Ask AI Career Advisor anything about skills, scholarships, or jobs..."
              disabled={asking}
              className="flex-1 px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-midnight-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              onClick={() => handleAsk()}
              disabled={asking || !inputQuestion.trim()}
              isLoading={asking}
              rightIcon={<Send className="h-4 w-4" />}
            >
              Ask
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
