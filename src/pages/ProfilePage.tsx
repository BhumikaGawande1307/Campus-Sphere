import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentService, ProfileCompletionStatus } from '../services/studentService';
import { certificateService } from '../services/certificateService';
import { skillService } from '../services/skillService';
import { projectService } from '../services/projectService';
import { eventService } from '../services/eventService';
import { scholarshipService } from '../services/scholarshipService';
import {
  StudentProfile,
  Certificate,
  Skill,
  Project,
  Event,
  ScholarshipBookmark,
  SkillProficiency,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Tabs } from '../components/Tabs';
import { Input, Select, Textarea } from '../components/Input';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import {
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  BookOpen,
  Award,
  Globe,
  Save,
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Edit3,
  Eye,
  FileCheck,
  Code2,
  Calendar,
  IndianRupee,
  ArrowRight,
  Clock,
  Layers,
  Plus,
  Trash2,
  Camera,
  Check,
  Sliders,
  TrendingUp,
  Briefcase,
  UploadCloud,
  X,
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../components/Icons';
import { UniversalScannerModal } from '../components/UniversalScannerModal';
import { ProfileCompletionWizardModal } from '../components/ProfileCompletionWizardModal';

const COVER_GRADIENTS = [
  { id: 'indigo', name: 'Celestial Indigo', class: 'from-blue-100 via-indigo-100/70 to-violet-100 border-indigo-200' },
  { id: 'emerald', name: 'Aurora Mint', class: 'from-emerald-100 via-teal-100/70 to-cyan-100 border-emerald-200' },
  { id: 'violet', name: 'Lavender Blossom', class: 'from-purple-100 via-violet-100/70 to-pink-100 border-purple-200' },
  { id: 'sunset', name: 'Sunrise Peach', class: 'from-amber-100 via-rose-100/70 to-orange-100 border-amber-200' },
];

const DEPARTMENT_OPTIONS = [
  { value: '1', label: 'Computer Science & Engineering (CSE)' },
  { value: '2', label: 'Information Technology (IT)' },
  { value: '3', label: 'Artificial Intelligence & Data Science (AI&DS)' },
  { value: '4', label: 'Electronics & Communication (ECE)' },
  { value: '5', label: 'Mechanical Engineering (MECH)' },
];

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [completion, setCompletion] = useState<ProfileCompletionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [coverTheme, setCoverTheme] = useState<string>('indigo');
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Related Entities
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [scholarshipBookmarks, setScholarshipBookmarks] = useState<ScholarshipBookmark[]>([]);

  // Skill & Project In-Page Creator State
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState<SkillProficiency>('ADVANCED');
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectTech, setNewProjectTech] = useState('');
  const [newProjectLink, setNewProjectLink] = useState('');

  // In-Profile Document Upload State
  const [isDocUploadOpen, setIsDocUploadOpen] = useState(false);
  const [docUploadForm, setDocUploadForm] = useState({
    title: '',
    issuer: '',
    category: 'Academic' as any,
    issue_date: new Date().toISOString().split('T')[0],
    credential_url: '',
    description: '',
    file: null as File | null,
    file_name: '',
  });
  const [docUploading, setDocUploading] = useState(false);

  const toast = useToast();

  // Master Comprehensive Form State (All Fields Editable)
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    student_id: '',
    department_id: '',
    course: '',
    year: '',
    semester: '',
    division: '',
    cgpa: '',
    bio: '',
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
  });

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [profRes, compRes, certsRes, skillsRes, projsRes, evRes, schRes] =
        await Promise.all([
          studentService.getMyProfile(),
          studentService.calculateProfileCompletion(),
          certificateService.getMyCertificates(),
          skillService.getSkills(),
          projectService.getProjects(),
          eventService.getEvents(),
          scholarshipService.getMyBookmarks(),
        ]);

      setProfile(profRes);
      setCompletion(compRes);
      setCertificates(certsRes);
      setSkills(skillsRes);
      setProjects(projsRes);
      setEvents(evRes.filter((e) => e.is_registered));
      setScholarshipBookmarks(schRes);

      setFormData({
        first_name: profRes.user?.first_name || user?.first_name || '',
        last_name: profRes.user?.last_name || user?.last_name || '',
        email: profRes.user?.email || user?.email || '',
        phone_number: profRes.user?.phone_number || user?.phone_number || '',
        student_id: profRes.student_id || '',
        department_id: profRes.department_id ? String(profRes.department_id) : (profRes.department?.id ? String(profRes.department?.id) : ''),
        course: profRes.course || '',
        year: profRes.year ? String(profRes.year) : '',
        semester: profRes.semester ? String(profRes.semester) : '',
        division: profRes.division || '',
        cgpa: profRes.cgpa != null ? String(profRes.cgpa) : '',
        bio: profRes.bio || '',
        github_url: profRes.github_url || '',
        linkedin_url: profRes.linkedin_url || '',
        portfolio_url: profRes.portfolio_url || '',
      });
    } catch {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  // Handle Complete Profile Save
  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await studentService.updateProfile({
        student_id: formData.student_id,
        department_id: Number(formData.department_id),
        course: formData.course,
        year: Number(formData.year),
        semester: Number(formData.semester),
        division: formData.division,
        cgpa: Number(formData.cgpa),
        bio: formData.bio,
        github_url: formData.github_url,
        linkedin_url: formData.linkedin_url,
        portfolio_url: formData.portfolio_url,
        user: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone_number: formData.phone_number,
        } as any,
      });

      if (refreshUser) refreshUser();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
      toast.success('Profile Updated Successfully! 🎉', 'All student credentials & details have been saved.');
      setViewMode('view');
      fetchProfileData();
    } catch {
      toast.error('Save Failed', 'Could not update profile information.');
    } finally {
      setSaving(false);
    }
  };

  // Add Skill in-place
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    try {
      await skillService.addSkill({
        name: newSkillName.trim(),
        proficiency: newSkillProficiency,
        category: 'Technical',
        is_verified: true,
      });
      setNewSkillName('');
      toast.success('Skill Added', `${newSkillName} added to your competencies.`);
      fetchProfileData();
    } catch {
      toast.error('Failed to add skill');
    }
  };

  const handleDeleteSkill = async (id: number) => {
    try {
      await skillService.deleteSkill(id);
      toast.info('Skill Removed');
      fetchProfileData();
    } catch {
      toast.error('Failed to delete skill');
    }
  };

  // Add Project in-place
  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;
    try {
      await projectService.createProject({
        title: newProjectTitle.trim(),
        description: newProjectDesc.trim(),
        technologies: newProjectTech.trim() || 'React, TypeScript, Node.js',
        github_link: newProjectLink.trim() || undefined,
        status: 'Completed',
      });
      setNewProjectTitle('');
      setNewProjectDesc('');
      setNewProjectTech('');
      setNewProjectLink('');
      toast.success('Project Created', 'Featured project added to your profile.');
      fetchProfileData();
    } catch {
      toast.error('Failed to create project');
    }
  };

  const handleDeleteProject = async (id: number) => {
    try {
      await projectService.deleteProject(id);
      toast.info('Project Deleted');
      fetchProfileData();
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const handleProfileDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docUploadForm.title.trim() || !docUploadForm.issuer.trim()) {
      toast.warning('Missing Fields', 'Please specify document title and issuing authority.');
      return;
    }
    setDocUploading(true);
    try {
      await certificateService.uploadCertificate(docUploadForm);
      confetti({ particleCount: 70, spread: 60 });
      toast.success('Document Vaulted! 🎉', 'Your credential was successfully added.');
      setIsDocUploadOpen(false);
      setDocUploadForm({
        title: '',
        issuer: '',
        category: 'Academic',
        issue_date: new Date().toISOString().split('T')[0],
        credential_url: '',
        description: '',
        file: null,
        file_name: '',
      });
      fetchProfileData();
    } catch (err: any) {
      toast.error('Upload Failed', err?.message || 'Database rejected document.');
    } finally {
      setDocUploading(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={6} />;

  const activeGradient = COVER_GRADIENTS.find((c) => c.id === coverTheme)?.class || COVER_GRADIENTS[0].class;
  const displayName = formData.first_name
    ? `${formData.first_name} ${formData.last_name}`
    : profile?.user?.first_name
    ? `${profile.user.first_name} ${profile.user.last_name}`
    : 'Aarav Sharma';
  const initial = (displayName[0] || 'A').toUpperCase();

  // SVG Circular Progress Ring
  const completionPct = completion?.percentage || 0;
  const ringRadius = 44;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (completionPct / 100) * ringCircumference;

  const proficiencyColor = (p: string) => {
    switch (p) {
      case 'EXPERT': return 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-900 border-purple-300';
      case 'ADVANCED': return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-900 border-blue-300';
      case 'INTERMEDIATE': return 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-900 border-emerald-300';
      default: return 'bg-gradient-to-r from-slate-100 to-gray-200 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ══════════════ ATTRACTIVE LIGHT GRADIENT HERO BANNER ══════════════ */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${activeGradient} text-slate-900 shadow-md border border-slate-200/90 transition-all duration-500`}>
        {/* Colorful Ambient Glow Orbs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-300/35 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute left-1/3 -top-10 h-48 w-48 rounded-full bg-indigo-300/30 blur-2xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute -left-16 -bottom-20 h-64 w-64 rounded-full bg-purple-300/30 blur-3xl animate-[pulse_5s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute right-1/4 bottom-0 h-32 w-32 rounded-full bg-amber-300/25 blur-2xl animate-[pulse_3s_ease-in-out_infinite]" />
        <div className="absolute inset-0 bg-white/20 pointer-events-none" />

        {/* Top Control Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 p-5 sm:p-7 pb-0">
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-2 hidden sm:inline">Theme</span>
            {COVER_GRADIENTS.map((g) => (
              <button key={g.id} onClick={() => setCoverTheme(g.id)} title={g.name}
                className={`h-5 w-5 rounded-full bg-gradient-to-r ${g.class} border-2 transition-all duration-300 ${coverTheme === g.id ? 'scale-125 border-indigo-600 shadow-md ring-2 ring-indigo-200' : 'border-slate-300 opacity-75 hover:opacity-100 hover:scale-110'}`} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setWizardOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 border border-amber-300 text-amber-900 text-xs font-bold shadow-xs transition-all duration-300 hover:scale-105">
              <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
              <span className="hidden sm:inline">Complete Profile</span><span className="sm:hidden">Wizard</span>
            </button>
            <button onClick={() => setViewMode(viewMode === 'view' ? 'edit' : 'view')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/95 hover:bg-white border border-slate-300 text-slate-800 text-xs font-bold shadow-xs transition-all duration-300 hover:scale-105">
              {viewMode === 'view' ? <Edit3 className="h-3.5 w-3.5 text-indigo-600" /> : <Eye className="h-3.5 w-3.5 text-indigo-600" />}
              <span className="hidden sm:inline">{viewMode === 'view' ? 'Edit Profile' : 'Preview'}</span><span className="sm:hidden">{viewMode === 'view' ? 'Edit' : 'View'}</span>
            </button>
            {viewMode === 'edit' && (
              <button onClick={() => handleSaveAll()} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all duration-300 hover:scale-105">
                <Save className="h-3.5 w-3.5" /> Save
              </button>
            )}
          </div>
        </div>

        {/* Centered Identity */}
        <div className="relative z-10 flex flex-col items-center text-center p-5 sm:p-7 pt-6 sm:pt-8 pb-8 sm:pb-10">
          <div className="relative group mb-5">
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 animate-[spin_6s_linear_infinite] blur-xs" />
            <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full bg-white border-4 border-white text-indigo-700 text-3xl sm:text-4xl font-black shadow-xl overflow-hidden ring-4 ring-indigo-200">
              {profile?.user?.avatar_url || user?.avatar_url ? (
                <img src={profile?.user?.avatar_url || user?.avatar_url} alt={displayName} className="h-full w-full object-cover" />
              ) : (initial)}
            </div>
            <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white z-10 shadow-xs">
              <Check className="h-3 w-3 text-white" />
            </span>
            <button type="button" onClick={() => setCameraModalOpen(true)} className="absolute -top-1 -right-1 p-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-md transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 z-10" title="Update Photo">
              <Camera className="h-3.5 w-3.5 text-indigo-600" />
            </button>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap justify-center mb-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{displayName}</h1>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" /> Verified
            </span>
          </div>
          <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-xl bg-white/95 text-indigo-900 border border-indigo-200 shadow-xs mb-3">{formData.student_id || 'ID Not Set'}</span>
          <p className="text-sm font-semibold text-slate-700 mb-1">{formData.course || 'Degree Not Set'} &bull; Year {formData.year || '-'}, Sem {formData.semester || '-'} ({formData.division || '-'})</p>
          <div className="flex items-center gap-x-4 gap-y-1 flex-wrap justify-center text-xs text-slate-600 font-medium">
            <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-indigo-600" />{formData.email || user?.email}</span>
            {formData.phone_number && (<><span className="text-slate-400">&bull;</span><span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-emerald-600" />{formData.phone_number}</span></>)}
          </div>
        </div>
      </div>

      {/* ══════════════ ATTRACTIVE LIGHT GRADIENT STATS ROW ══════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'CGPA', value: formData.cgpa || '0.00', sub: '/ 10.0', icon: GraduationCap, cardBg: 'bg-gradient-to-br from-emerald-50 via-white to-teal-50/70 border-emerald-200 border-l-emerald-500', accent: 'text-emerald-700', iconBg: 'bg-emerald-100 text-emerald-700' },
          { label: 'Points', value: String(profile?.points || 0), sub: 'pts', icon: Award, cardBg: 'bg-gradient-to-br from-purple-50 via-white to-pink-50/70 border-purple-200 border-l-purple-500', accent: 'text-purple-700', iconBg: 'bg-purple-100 text-purple-700' },
          { label: 'Vault Docs', value: String(certificates.length), sub: 'verified', icon: FileCheck, cardBg: 'bg-gradient-to-br from-sky-50 via-white to-blue-50/70 border-sky-200 border-l-sky-500', accent: 'text-sky-700', iconBg: 'bg-sky-100 text-sky-700' },
          { label: 'Readiness', value: `${profile?.placement_readiness_score || 0}%`, sub: 'ATS', icon: Briefcase, cardBg: 'bg-gradient-to-br from-cyan-50 via-white to-indigo-50/70 border-cyan-200 border-l-cyan-500', accent: 'text-cyan-700', iconBg: 'bg-cyan-100 text-cyan-700' },
        ].map((s) => (
          <div key={s.label} className={`relative p-4 sm:p-5 rounded-2xl ${s.cardBg} border border-l-4 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600">{s.label}</span>
              <div className={`p-1.5 rounded-xl ${s.iconBg}`}><s.icon className="h-4 w-4" /></div>
            </div>
            <p className={`text-xl sm:text-2xl font-black font-mono ${s.accent}`}>{s.value} <span className="text-xs font-semibold text-slate-500">{s.sub}</span></p>
          </div>
        ))}
        {completion && (
          <div className="col-span-2 sm:col-span-1 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-violet-50/70 border border-indigo-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 flex flex-col items-center justify-center">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={ringRadius} fill="none" stroke="currentColor" strokeWidth="6" className="text-indigo-100" />
              <circle cx="50" cy="50" r={ringRadius} fill="none" strokeWidth="6" strokeLinecap="round" stroke="url(#completionGrad)" strokeDasharray={ringCircumference} strokeDashoffset={ringOffset} className="transition-all duration-1000" />
              <defs><linearGradient id="completionGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#10b981" /></linearGradient></defs>
            </svg>
            <p className="text-lg font-black font-mono text-indigo-950 -mt-[60px] mb-6">{completionPct}%</p>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">Complete</span>
          </div>
        )}
      </div>

      {/* Missing Items */}
      {completion && completion.items.some((i) => !i.is_completed) && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/50 to-yellow-50 border border-amber-200 shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Missing:</span>
            {completion.items.filter((i) => !i.is_completed).map((item) => (
              <button key={item.id} onClick={() => setViewMode('edit')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all duration-200 hover:scale-105 shadow-2xs">
                <Plus className="h-3 w-3" /> {item.action_text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Main Content: Edit Mode vs Interactive View Mode */}
      {viewMode === 'edit' ? (
        /* ================= EDIT ALL DETAILS MODE ================= */
        <form onSubmit={handleSaveAll} className="space-y-6">
          {/* Section 1: Personal & Contact Information */}
          <Card className="p-6 sm:p-8 space-y-5 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/40 border border-indigo-100/90 rounded-2xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-indigo-500">
            <CardHeader
              title="Personal & Contact Information"
              subtitle="Update your full legal name, official university email, contact phone, and biographical summary"
              badge={
                <span className="flex items-center justify-center h-7 w-7 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-black shadow-xs">1</span>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Aarav"
              />
              <Input
                label="Last Name"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Sharma"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Official Email Address"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="aarav.sharma@campus.edu"
                leftIcon={<Mail className="h-4 w-4" />}
              />
              <Input
                label="Phone / Mobile Number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+91 98765 43210"
                leftIcon={<Phone className="h-4 w-4" />}
              />
            </div>

            <Textarea
              label="Professional Bio & Career Objective"
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Describe your technical focus (e.g. Distributed Cloud Systems, Generative AI), research interests, and career ambitions..."
            />
          </Card>

          {/* Section 2: Academic & Institutional Records */}
          <Card className="p-6 sm:p-8 space-y-5 bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/40 border border-emerald-100/90 rounded-2xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-emerald-500">
            <CardHeader
              title="Academic & Departmental Records"
              subtitle="Configure your enrolled department, degree curriculum, student roll ID, semester, and cumulative CGPA"
              badge={
                <span className="flex items-center justify-center h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black shadow-xs">2</span>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Student Roll / Registration ID"
                required
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                placeholder="CS2026001"
              />
              <Select
                label="Department"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                options={DEPARTMENT_OPTIONS}
              />
            </div>

            <Input
              label="Enrolled Degree & Major Program"
              required
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              placeholder="e.g. B.Tech in Computer Science & Engineering"
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input
                label="Academic Year"
                type="number"
                min="1"
                max="5"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              />
              <Input
                label="Current Semester"
                type="number"
                min="1"
                max="10"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              />
              <Input
                label="Class Division / Section"
                value={formData.division}
                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                placeholder="A"
              />
              <Input
                label="Cumulative CGPA"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={formData.cgpa}
                onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
              />
            </div>
          </Card>

          {/* Section 3: Social & External Portfolios */}
          <Card className="p-6 sm:p-8 space-y-5 bg-gradient-to-br from-white via-slate-50/50 to-purple-50/40 border border-purple-100/90 rounded-2xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-purple-500">
            <CardHeader
              title="Social & Developer Web Presence"
              subtitle="Connect your GitHub, LinkedIn, and personal portfolio websites for recruiters"
              badge={
                <span className="flex items-center justify-center h-7 w-7 rounded-full bg-purple-100 text-purple-800 border border-purple-200 text-xs font-black shadow-xs">3</span>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="GitHub Profile URL"
                type="url"
                value={formData.github_url}
                onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                placeholder="https://github.com/username"
                leftIcon={<GithubIcon className="h-4 w-4" />}
              />
              <Input
                label="LinkedIn Profile URL"
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                leftIcon={<LinkedinIcon className="h-4 w-4 text-blue-600" />}
              />
              <Input
                label="Personal Website / Portfolio"
                type="url"
                value={formData.portfolio_url}
                onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                placeholder="https://aaravsharma.dev"
                leftIcon={<Globe className="h-4 w-4 text-emerald-600" />}
              />
            </div>
          </Card>

          {/* Save Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewMode('view')}
              className="rounded-xl px-5 py-2.5 font-semibold text-xs transition-all hover:bg-slate-50 border-slate-200 text-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={saving}
              leftIcon={<Save className="h-4 w-4" />}
              className="rounded-xl px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all hover:scale-105"
            >
              Save All Profile Details
            </Button>
          </div>
        </form>
      ) : (
        /* ================= INTERACTIVE VIEW MODE WITH SUB-TABS ================= */
        <div className="space-y-6">
          <Tabs
            tabs={[
              { id: 'overview', label: 'Academic & Personal Overview', icon: GraduationCap },
              { id: 'skills_projects', label: `Skills & Projects Studio (${skills.length + projects.length})`, icon: Code2 },
              { id: 'certificates', label: `Verified Credentials in Vault (${certificates.length})`, icon: FileCheck },
              { id: 'scholarships', label: `Tracked Financial Aid (${scholarshipBookmarks.length})`, icon: IndianRupee },
              { id: 'events', label: `Event Registrations (${events.length})`, icon: Calendar },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          {/* Sub-tab 1: Academic & Personal Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (7 Cols): Academic Records */}
              <Card className="lg:col-span-7 p-6 sm:p-7 space-y-5 bg-gradient-to-br from-white via-slate-50/40 to-indigo-50/30 border border-indigo-100/90 rounded-2xl shadow-sm hover:shadow-md transition-all border-t-4 border-t-indigo-500">
                <CardHeader
                  title="Academic Standing & Department Records"
                  subtitle="Active institutional records verified across university portals"
                  action={
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setViewMode('edit')}
                      leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                      className="rounded-xl text-xs font-bold hover:bg-indigo-50 text-indigo-700 border border-indigo-100"
                    >
                      Edit Fields
                    </Button>
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-purple-50/40 border border-indigo-100/80 space-y-1.5 shadow-2xs hover:shadow-xs transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-indigo-900/80 uppercase font-bold tracking-wider">Student Roll ID</span>
                      <UserIcon className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <p className="font-black font-mono text-slate-900 text-base">
                      {formData.student_id || 'Not Assigned'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-200/80 space-y-1.5 shadow-2xs hover:shadow-xs transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-emerald-900/80 uppercase font-bold tracking-wider">Cumulative CGPA</span>
                      <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <p className="font-black font-mono text-emerald-700 text-base">
                      {formData.cgpa || '0.00'} <span className="text-xs font-bold text-emerald-900/60">/ 10.0</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-200/80 space-y-1 sm:col-span-2 shadow-2xs hover:shadow-xs transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-blue-900/80 uppercase font-bold tracking-wider">Enrolled Degree & Program</span>
                      <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <p className="font-bold text-slate-900 text-sm">
                      {formData.course || 'Degree Program Not Specified'}
                    </p>
                    <p className="text-xs text-slate-600 flex items-center gap-1.5 pt-0.5 font-medium">
                      <Building2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      {profile?.department?.name || 'Computer Science & Engineering'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50/70 to-cyan-50/40 border border-sky-200/80 space-y-1.5 shadow-2xs hover:shadow-xs transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-sky-900/80 uppercase font-bold tracking-wider">Academic Year</span>
                      <Calendar className="h-3.5 w-3.5 text-sky-600" />
                    </div>
                    <p className="font-bold text-sky-800">
                      Year {formData.year || '1'} &bull; Semester {formData.semester || '1'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/70 to-pink-50/40 border border-purple-200/80 space-y-1.5 shadow-2xs hover:shadow-xs transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-purple-900/80 uppercase font-bold tracking-wider">Class Division</span>
                      <Layers className="h-3.5 w-3.5 text-purple-600" />
                    </div>
                    <p className="font-bold text-slate-900">
                      Section {formData.division || 'A'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Right Column (5 Cols): Bio & External Portfolios */}
              <Card className="lg:col-span-5 p-6 sm:p-7 space-y-5 bg-gradient-to-br from-white via-slate-50/40 to-purple-50/30 border border-purple-100/90 rounded-2xl shadow-sm hover:shadow-md transition-all border-t-4 border-t-purple-500">
                <CardHeader
                  title="Professional Bio & Portals"
                  subtitle="Attached to your ATS resume exports and applications"
                />

                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900/80 block">
                      Bio & Career Summary
                    </span>
                    <p className="text-slate-800 leading-relaxed bg-gradient-to-br from-purple-50/40 to-pink-50/30 p-4 rounded-2xl border border-purple-100/90 shadow-2xs text-xs font-medium">
                      {formData.bio || '"No personal bio added yet. Click Edit Fields to describe your technical focus, achievements, and career ambitions."'}
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                      Connected Developer Portals
                    </span>
                    <div className="grid grid-cols-1 gap-2.5">
                      <a
                        href={formData.github_url || 'https://github.com'}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-slate-200/90 text-slate-900 hover:border-indigo-300 transition-all duration-200 shadow-2xs hover:scale-[1.02]"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="p-1.5 rounded-xl bg-white border border-slate-200 group-hover:bg-indigo-100 transition-colors">
                            <GithubIcon className="h-4 w-4 shrink-0" />
                          </div>
                          <span className="truncate font-bold text-xs">{formData.github_url || 'Add GitHub Profile'}</span>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-600 shrink-0 transition-colors" />
                      </a>

                      <a
                        href={formData.linkedin_url || 'https://linkedin.com'}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/60 to-indigo-50/40 border border-blue-200/90 text-slate-900 hover:border-blue-300 transition-all duration-200 shadow-2xs hover:scale-[1.02]"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="p-1.5 rounded-xl bg-white border border-blue-200 group-hover:bg-blue-100 transition-colors">
                            <LinkedinIcon className="h-4 w-4 text-blue-600 shrink-0" />
                          </div>
                          <span className="truncate font-bold text-xs">{formData.linkedin_url || 'Add LinkedIn Profile'}</span>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-600 shrink-0 transition-colors" />
                      </a>

                      <a
                        href={formData.portfolio_url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/60 to-teal-50/40 border border-emerald-200/90 text-slate-900 hover:border-emerald-300 transition-all duration-200 shadow-2xs hover:scale-[1.02]"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="p-1.5 rounded-xl bg-white border border-emerald-200 group-hover:bg-emerald-100 transition-colors">
                            <Globe className="h-4 w-4 text-emerald-600 shrink-0" />
                          </div>
                          <span className="truncate font-bold text-xs">{formData.portfolio_url || 'Add Personal Website'}</span>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-600 shrink-0 transition-colors" />
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Sub-tab 2: Skills & Projects Studio (Editable In-Place) */}
          {activeTab === 'skills_projects' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Technical Skills Manager (6 Cols) */}
              <Card className="lg:col-span-6 p-6 sm:p-7 space-y-5 bg-gradient-to-br from-white via-slate-50/40 to-blue-50/30 border border-blue-100/90 rounded-2xl shadow-sm hover:shadow-md transition-all border-t-4 border-t-blue-500">
                <CardHeader
                  title="Technical Competencies"
                  subtitle="Add, verify, and showcase skills with proficiency levels"
                  badge={
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold">
                      {skills.length} Skills
                    </span>
                  }
                />

                {/* Add Skill Mini Form */}
                <form onSubmit={handleAddSkill} className="flex items-center gap-2 p-1.5 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/50 border border-blue-200/80">
                  <input
                    type="text"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="Add skill (e.g. Kubernetes, React, Python)..."
                    className="flex-1 px-3 py-2 rounded-xl text-xs border-0 bg-transparent text-slate-900 font-medium placeholder:text-slate-500 focus:outline-none"
                  />
                  <select
                    value={newSkillProficiency}
                    onChange={(e) => setNewSkillProficiency(e.target.value as SkillProficiency)}
                    className="px-3 py-2 rounded-xl text-xs border border-blue-200 bg-white text-slate-800 font-bold focus:outline-none shadow-xs"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                  <Button
                    type="submit"
                    size="sm"
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    className="rounded-xl px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm shadow-blue-500/20"
                  >
                    Add
                  </Button>
                </form>

                {/* Skills Chips Grid */}
                {skills.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 font-medium text-xs">
                    No skills added yet. Type a skill name and level above to add your competencies.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {skills.map((s) => (
                      <div
                        key={s.id}
                        className={`group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold shadow-2xs transition-all duration-200 hover:scale-105 ${proficiencyColor(
                          s.proficiency
                        )}`}
                      >
                        <span>{s.name}</span>
                        <span className="text-[10px] uppercase font-mono opacity-80 font-normal">
                          {s.proficiency}
                        </span>
                        <button
                          onClick={() => handleDeleteSkill(s.id)}
                          className="text-slate-500 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
                          title="Delete skill"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Featured Projects Manager (6 Cols) */}
              <Card className="lg:col-span-6 p-6 sm:p-7 space-y-5 bg-gradient-to-br from-white via-slate-50/40 to-indigo-50/30 border border-indigo-100/90 rounded-2xl shadow-sm hover:shadow-md transition-all border-t-4 border-t-indigo-500">
                <CardHeader
                  title="Featured Engineering Projects"
                  subtitle="Showcase live repos, architectures, and full-stack systems"
                  badge={
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold">
                      {projects.length} Projects
                    </span>
                  }
                />

                {/* Add Project Form */}
                <form
                  onSubmit={handleAddProject}
                  className="space-y-3 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-indigo-200/80 shadow-2xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={newProjectTitle}
                      onChange={(e) => setNewProjectTitle(e.target.value)}
                      placeholder="Project Title (e.g. Distributed CRDTs)..."
                      className="px-3.5 py-2 rounded-xl text-xs border border-indigo-200 bg-white text-slate-900 font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                    />
                    <input
                      type="url"
                      value={newProjectLink}
                      onChange={(e) => setNewProjectLink(e.target.value)}
                      placeholder="GitHub / Live Demo Link..."
                      className="px-3.5 py-2 rounded-xl text-xs border border-indigo-200 bg-white text-slate-900 font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                    />
                  </div>
                  <input
                    type="text"
                    value={newProjectTech}
                    onChange={(e) => setNewProjectTech(e.target.value)}
                    placeholder="Technologies (e.g. React, TypeScript, Rust, Docker)..."
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-indigo-200 bg-white text-slate-900 font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                  />
                  <textarea
                    rows={2}
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="Brief description of system architecture..."
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-indigo-200 bg-white text-slate-900 font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      leftIcon={<Plus className="h-3.5 w-3.5" />}
                      className="rounded-xl px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm shadow-indigo-500/20"
                    >
                      Add Project
                    </Button>
                  </div>
                </form>

                {/* Project List */}
                {projects.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 font-medium text-xs">
                    No projects showcased yet. Add your portfolio projects to impress recruiters.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {projects.map((p) => (
                      <div
                        key={p.id}
                        className="group p-4 rounded-2xl border border-indigo-100/90 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 space-y-2 shadow-2xs hover:shadow-sm hover:border-indigo-300 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Code2 className="h-4 w-4 text-indigo-600 shrink-0" />
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                              {p.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            {p.github_link && (
                              <a
                                href={p.github_link}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                title="Open Link"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteProject(p.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete project"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed line-clamp-2">
                          {p.description}
                        </p>
                        {p.technologies && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {p.technologies.split(',').map((t) => (
                              <span
                                key={t}
                                className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200/80 shadow-2xs"
                              >
                                {t.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Sub-tab 3: Verified Vault Credentials */}
          {activeTab === 'certificates' && (
            <Card className="p-6 sm:p-7 space-y-5 bg-gradient-to-br from-white via-slate-50/40 to-sky-50/30 border border-sky-100/90 rounded-2xl shadow-sm hover:shadow-md transition-all border-t-4 border-t-sky-500">
              <CardHeader
                title="Cryptographic Verified Credentials in Vault"
                subtitle="Tamper-evident marksheets, academic degrees, and industry certifications"
                badge={
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold">
                    {certificates.length} Verified
                  </span>
                }
                action={
                  <div className="flex items-center gap-2.5">
                    <Button
                      size="sm"
                      onClick={() => setIsDocUploadOpen(true)}
                      leftIcon={<Plus className="h-3.5 w-3.5" />}
                      className="rounded-xl px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-sm shadow-sky-500/20"
                    >
                      Upload to Vault
                    </Button>
                    <Link
                      to="/certificates"
                      className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                    >
                      Open Vault <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                }
              />

              {certificates.length === 0 ? (
                <EmptyState
                  title="No Credentials in Vault"
                  description="Upload semester marksheets or certifications in the Document Vault to earn verified badges."
                  actionText="Upload Document"
                  onAction={() => setIsDocUploadOpen(true)}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="group p-4 sm:p-5 rounded-2xl border border-sky-200/70 bg-gradient-to-br from-white via-sky-50/30 to-blue-50/30 space-y-2.5 shadow-2xs hover:shadow-sm hover:border-sky-300 transition-all duration-200 hover:scale-[1.02]"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="success" size="sm" dot>
                          Verified
                        </Badge>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">
                          +{cert.points_awarded || 50} pts
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-sky-700 transition-colors">
                          {cert.title}
                        </h4>
                        <p className="text-xs text-slate-600 font-medium truncate flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 shrink-0 text-slate-500" />
                          <span>{cert.issuer}</span>
                          <span className="text-slate-300">&bull;</span>
                          <span className="font-mono text-[10px] text-slate-700">{cert.certificate_uid}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Sub-tab 4: Tracked Financial Aid */}
          {activeTab === 'scholarships' && (
            <Card className="p-6 sm:p-7 space-y-5 bg-gradient-to-br from-white via-slate-50/40 to-emerald-50/30 border border-emerald-100/90 rounded-2xl shadow-sm hover:shadow-md transition-all border-t-4 border-t-emerald-500">
              <CardHeader
                title="Tracked Scholarships & Aid Applications"
                subtitle="Fellowships matching your CGPA and application progress"
                badge={
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold">
                    {scholarshipBookmarks.length} Tracked
                  </span>
                }
                action={
                  <Link
                    to="/scholarships"
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    Browse All Fellowships <ArrowRight className="h-3 w-3" />
                  </Link>
                }
              />

              {scholarshipBookmarks.length === 0 ? (
                <EmptyState
                  title="No Tracked Scholarships"
                  description="Explore opportunities in the Scholarships directory to bookmark grants."
                />
              ) : (
                <div className="space-y-3">
                  {scholarshipBookmarks.map((b) => (
                    <div
                      key={b.id}
                      className="group p-4 sm:p-5 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 flex items-center justify-between gap-4 shadow-2xs hover:shadow-sm hover:border-emerald-300 transition-all duration-200 hover:scale-[1.01]"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <Badge variant="primary" size="sm">
                            {b.status}
                          </Badge>
                          <span className="text-sm font-black text-emerald-700 font-mono">
                            {b.scholarship?.amount}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                          {b.scholarship?.title}
                        </h4>
                        <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 shrink-0 text-slate-500" />
                          <span>Provider: {b.scholarship?.provider}</span>
                        </p>
                      </div>
                      <Link to="/scholarships">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl px-4 py-1.5 text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300"
                        >
                          Manage
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Sub-tab 5: Event Registrations */}
          {activeTab === 'events' && (
            <Card className="p-6 sm:p-7 space-y-5 bg-gradient-to-br from-white via-slate-50/40 to-amber-50/30 border border-amber-100/90 rounded-2xl shadow-sm hover:shadow-md transition-all border-t-4 border-t-amber-500">
              <CardHeader
                title="Enrolled Campus Events & Workshops"
                subtitle="Your hackathon and technical session participation records"
                badge={
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold">
                    {events.length} Enrolled
                  </span>
                }
                action={
                  <Link
                    to="/events"
                    className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
                  >
                    Browse Events <ArrowRight className="h-3 w-3" />
                  </Link>
                }
              />

              {events.length === 0 ? (
                <EmptyState
                  title="No Event Enrollments"
                  description="Register dynamically for upcoming masterclasses to earn activity points."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className="group p-4 sm:p-5 rounded-2xl border border-amber-200/70 bg-gradient-to-br from-white via-amber-50/30 to-orange-50/30 space-y-2.5 shadow-2xs hover:shadow-sm hover:border-amber-300 transition-all duration-200 hover:scale-[1.02]"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="primary" size="sm">
                          {ev.category}
                        </Badge>
                        <span className="text-xs font-bold text-amber-900 font-mono px-2 py-0.5 rounded-lg bg-amber-100 border border-amber-300">
                          +{ev.points_reward} pts
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-amber-700 transition-colors">
                        {ev.title}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium flex items-center gap-2">
                        <span>Venue: {ev.venue}</span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-amber-600" />
                          {new Date(ev.start_date).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Camera Portrait Studio Modal */}
      <UniversalScannerModal
        isOpen={cameraModalOpen}
        onClose={() => {
          setCameraModalOpen(false);
          fetchProfileData();
        }}
        initialMode="profile_photo"
      />

      {/* Automated Profile Completion Wizard Modal */}
      <ProfileCompletionWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        profile={profile}
        onProfileUpdated={fetchProfileData}
      />

      {/* In-Profile Document Upload Modal */}
      <Modal
        isOpen={isDocUploadOpen}
        onClose={() => setIsDocUploadOpen(false)}
        title="Upload Credential to Vault"
        description="Attach marksheets, certifications, or transcripts directly to your student record."
        size="md"
      >
        <form onSubmit={handleProfileDocUpload} className="space-y-4 text-xs">
          <Input
            label="Document Title"
            required
            value={docUploadForm.title}
            onChange={(e) => setDocUploadForm({ ...docUploadForm, title: e.target.value })}
            placeholder="e.g. Semester 4 Marksheet or Python Certification"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Issuing Institution"
              required
              value={docUploadForm.issuer}
              onChange={(e) => setDocUploadForm({ ...docUploadForm, issuer: e.target.value })}
              placeholder="e.g. University Examination Board"
            />
            <Select
              label="Category"
              value={docUploadForm.category}
              onChange={(e) => setDocUploadForm({ ...docUploadForm, category: e.target.value as any })}
              options={[
                { value: 'Academic', label: 'Academic Marksheet' },
                { value: 'Certification', label: 'Technical Certification' },
                { value: 'Internship', label: 'Internship Proof' },
                { value: 'Hackathon', label: 'Hackathon Win' },
                { value: 'Identity', label: 'Identity Card' },
                { value: 'Research', label: 'Research Paper' },
              ]}
            />
          </div>

          <Input
            label="Issue Date"
            type="date"
            required
            value={docUploadForm.issue_date}
            onChange={(e) => setDocUploadForm({ ...docUploadForm, issue_date: e.target.value })}
          />

          <Input
            label="Verification Link (Optional)"
            type="url"
            value={docUploadForm.credential_url}
            onChange={(e) => setDocUploadForm({ ...docUploadForm, credential_url: e.target.value })}
            placeholder="https://credly.com/... or official verify URL"
          />

          {/* Document File Selector */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Attach Document File (PDF or Image)
            </label>
            <div className="p-4 rounded-xl border-2 border-dashed border-indigo-200 text-center space-y-1.5 bg-gradient-to-br from-indigo-50/40 via-white to-sky-50/40">
              <UploadCloud className="h-6 w-6 mx-auto text-indigo-600" />
              {docUploadForm.file_name ? (
                <p className="text-xs font-bold text-emerald-600 truncate">
                  ✓ {docUploadForm.file_name}
                </p>
              ) : (
                <p className="text-xs text-slate-500">Click to browse or drag file (max 15MB)</p>
              )}
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const f = e.target.files[0];
                    setDocUploadForm((p) => ({
                      ...p,
                      file: f,
                      file_name: f.name,
                      title: p.title || f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
                    }));
                  }
                }}
                className="text-xs text-slate-500 mx-auto"
              />
            </div>
          </div>

          <Textarea
            label="Description & Highlights (Optional)"
            value={docUploadForm.description}
            onChange={(e) => setDocUploadForm({ ...docUploadForm, description: e.target.value })}
            placeholder="Key courses, SGPA, or validation notes..."
            rows={2}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDocUploadOpen(false)}
              disabled={docUploading}
              className="rounded-xl px-4 py-2 font-semibold text-xs text-slate-700 hover:bg-slate-50 border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={docUploading}
              isLoading={docUploading}
              className="rounded-xl px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm shadow-indigo-500/20"
              leftIcon={<UploadCloud className="h-3.5 w-3.5" />}
            >
              {docUploading ? 'Uploading...' : 'Save to Vault'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
