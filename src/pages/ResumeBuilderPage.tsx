import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { studentService } from '../services/studentService';
import { skillService } from '../services/skillService';
import { projectService } from '../services/projectService';
import { certificateService } from '../services/certificateService';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input, Textarea } from '../components/Input';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../context/ToastContext';
import html2pdf from 'html2pdf.js';
import {
  ResumePreview,
  ResumeData,
  ResumeTemplateId,
  AccentColorId,
  FontFamilyId,
  DensityMode,
  A4_WIDTH_PX,
  A4_HEIGHT_PX,
  ACCENT_COLORS,
} from '../components/resume/ResumePreview';
import {
  Download,
  Trash2,
  Save,
  RotateCcw,
  AlignLeft,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Code,
  Award,
  User,
  Plus,
  ZoomIn,
  ZoomOut,
  Sliders,
  Eye,
  Edit3,
  Printer,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  FileText,
  Sparkles,
  Layers,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Check,
  AlertTriangle,
  Zap,
  Info,
  ChevronRight,
  Scissors,
  Wand2,
  Clock,
  BarChart3,
  HelpCircle,
} from 'lucide-react';

/* ── Default Starter Resume Data ────────────────────────────── */
const DEFAULT_RESUME_DATA: ResumeData = {
  personal: {
    fullName: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
  },
  summary: '',
  education: [],
  experience: [],
  projects: [],
  skills: { programming: [], web: [], tools: [] },
  certificates: [],
};

type SectionKey =
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
  | 'projects'
  | 'skills'
  | 'certificates'
  | 'style';

interface SectionConfig {
  id: SectionKey;
  label: string;
  icon: React.ElementType;
  description: string;
}

const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'personal', label: 'Personal Info', icon: User, description: 'Contact & headline details' },
  { id: 'summary', label: 'Summary', icon: AlignLeft, description: 'Executive career overview' },
  { id: 'experience', label: 'Work Experience', icon: Briefcase, description: 'Internships & industry roles' },
  { id: 'education', label: 'Education', icon: GraduationCap, description: 'Degrees, college & CGPA' },
  { id: 'projects', label: 'Projects', icon: FolderGit2, description: 'Software & technical builds' },
  { id: 'skills', label: 'Technical Skills', icon: Code, description: 'Languages, frameworks & tools' },
  { id: 'certificates', label: 'Certificates', icon: Award, description: 'Credentials & honors' },
];

const ALL_MOBILE_SECTIONS: { id: SectionKey; label: string; icon: React.ElementType }[] = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'summary', label: 'Summary', icon: AlignLeft },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'skills', label: 'Skills', icon: Code },
  { id: 'certificates', label: 'Certs', icon: Award },
  { id: 'style', label: 'Style & Theme', icon: Sliders },
];

const ACTION_VERBS = [
  'Spearheaded',
  'Architected',
  'Engineered',
  'Optimized',
  'Developed',
  'Automated',
  'Accelerated',
  'Streamlined',
  'Collaborated',
  'Implemented',
];

export const ResumeBuilderPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [resumeData, setResumeData] = useState<ResumeData>(DEFAULT_RESUME_DATA);
  const [activeSection, setActiveSection] = useState<SectionKey>('personal');
  const [activeView, setActiveView] = useState<'studio' | 'canvas' | 'ats'>('studio');
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview' | 'ats'>('editor');

  // Document Styling & Layout Presets
  const [template, setTemplate] = useState<ResumeTemplateId>('executive');
  const [accentColor, setAccentColor] = useState<AccentColorId>('indigo');
  const [fontFamily, setFontFamily] = useState<FontFamilyId>('sans');
  const [density, setDensity] = useState<DensityMode>('standard');
  const [showPageCutGuides, setShowPageCutGuides] = useState(true);

  // Zoom & Preview Sizing
  const [userZoom, setUserZoom] = useState<number | 'fit'>('fit');
  const [containerWidth, setContainerWidth] = useState(600);
  const [pageCount, setPageCount] = useState(1);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  // Metadata & Status
  const [documentTitle, setDocumentTitle] = useState('My Placement Resume');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Skill Input Helpers
  const [newProgSkill, setNewProgSkill] = useState('');
  const [newWebSkill, setNewWebSkill] = useState('');
  const [newToolSkill, setNewToolSkill] = useState('');

  // Section Ordering
  const [sectionsOrder, setSectionsOrder] = useState<SectionKey[]>([
    'personal',
    'summary',
    'experience',
    'education',
    'projects',
    'skills',
    'certificates',
  ]);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const resumePrintRef = useRef<HTMLDivElement>(null);

  const STORAGE_KEY = `cs_resume_${user?.id || 'guest'}`;
  const SETTINGS_KEY = `cs_resume_settings_${user?.id || 'guest'}`;

  // Measure preview container width for auto-fit scaling
  useEffect(() => {
    if (!previewContainerRef.current) return;
    const updateWidth = () => {
      if (previewContainerRef.current) {
        setContainerWidth(previewContainerRef.current.clientWidth);
      }
    };
    updateWidth();
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(previewContainerRef.current);
    return () => ro.disconnect();
  }, [activeView, mobileTab]);

  // Load existing draft or student profile defaults
  const loadResumeData = useCallback(async () => {
    setLoading(true);
    const cachedData = localStorage.getItem(STORAGE_KEY);
    const cachedSettings = localStorage.getItem(SETTINGS_KEY);

    if (cachedSettings) {
      try {
        const parsed = JSON.parse(cachedSettings);
        if (parsed.template) setTemplate(parsed.template);
        if (parsed.accentColor) setAccentColor(parsed.accentColor);
        if (parsed.fontFamily) setFontFamily(parsed.fontFamily);
        if (parsed.density) setDensity(parsed.density);
        if (parsed.documentTitle) setDocumentTitle(parsed.documentTitle);
        if (parsed.sectionsOrder) setSectionsOrder(parsed.sectionsOrder);
      } catch (err) {
        console.warn('Could not parse cached resume settings', err);
      }
    }

    try {
      const [profRes, skillsRes, projRes, certRes] = await Promise.all([
        studentService.getMyProfile().catch(() => null),
        skillService.getSkills().catch(() => []),
        projectService.getProjects().catch(() => []),
        certificateService.getMyCertificates().catch(() => []),
      ]);

      const defaultSummary =
        'Driven and analytical Computer Science student with a solid background in software development, web architectures, and cloud services. Proven track record of shipping production-grade applications and collaborating in fast-paced software teams.';

      const baseData: ResumeData = {
        personal: {
          fullName: profRes?.user?.first_name
            ? `${profRes.user.first_name} ${profRes.user.last_name || ''}`.trim()
            : 'Aarav Sharma',
          headline: profRes?.course
            ? `${profRes.course} · ${profRes.department?.name || 'Computer Science'}`
            : 'B.Tech in Computer Science & Engineering',
          email: profRes?.user?.email || 'aarav.sharma@campus.edu',
          phone: profRes?.user?.phone_number || '+91 98765 43210',
          location: 'Pune, Maharashtra',
          githubUrl: profRes?.github_url || 'github.com/aaravsharma',
          linkedinUrl: profRes?.linkedin_url || 'linkedin.com/in/aaravsharma',
          portfolioUrl: 'aaravsharma.dev',
        },
        summary: profRes?.bio || defaultSummary,
        education: [
          {
            id: 'edu-1',
            institution: 'CampusSphere University Institute of Technology',
            degree: profRes?.course || 'B.Tech in Computer Science & Engineering',
            cgpa: profRes?.cgpa ? `${profRes.cgpa} / 10.0` : '8.92 / 10.0',
            startYear: '2023',
            endYear: '2027',
          },
        ],
        experience: [
          {
            id: 'exp-1',
            title: 'Software Engineering Intern',
            company: 'TechNova Solutions',
            location: 'Pune, Maharashtra',
            startDate: 'May 2025',
            endDate: 'Aug 2025',
            description:
              'Engineered and deployed scalable RESTful APIs using Node.js and TypeScript, reducing query response times by 28%.\nDeveloped modern, responsive web interfaces using React and Tailwind CSS, increasing user session engagement.\nAutomated CI/CD test workflows via GitHub Actions and Docker containers for reliable staging releases.',
          },
        ],
        projects:
          projRes.length > 0
            ? projRes.map((p) => ({
                id: String(p.id),
                title: p.title,
                technologies: p.technologies || 'React, TypeScript, Supabase',
                demoLink: p.github_link || p.demo_link || 'github.com/project-demo',
                description: p.description,
              }))
            : [
                {
                  id: 'proj-1',
                  title: 'CampusSphere — Intelligent Academic Platform',
                  technologies: 'React 18, TypeScript, Tailwind CSS, Supabase, PostgreSQL',
                  demoLink: 'github.com/campus-sphere',
                  description:
                    'Architected a multi-tenant university portal serving 4,000+ students with verified attendance and credential vaults.\nImplemented cryptographic QR attendance validation with anti-spoofing geofence algorithms.\nDesigned normalized relational database schemas with Row Level Security (RLS) policies.',
                },
                {
                  id: 'proj-2',
                  title: 'Microservices Real-Time Event Dispatcher',
                  technologies: 'Go, Docker, Redis, WebSocket, AWS ECS',
                  demoLink: 'github.com/event-dispatcher',
                  description:
                    'Engineered an ultra-low latency event streaming engine handling 10,000+ concurrent WebSocket connections.\nIntegrated Redis Pub/Sub channels to distribute broadcast notifications across distributed worker nodes with sub-20ms latency.',
                },
              ],
        skills: {
          programming:
            skillsRes.length > 0
              ? skillsRes
                  .filter((s) => s.category === 'TECHNICAL' || s.category === 'CORE')
                  .map((s) => s.name)
              : ['TypeScript', 'JavaScript', 'Python', 'Java', 'SQL', 'C++'],
          web: ['React', 'Next.js', 'Node.js', 'Express', 'Tailwind CSS', 'PostgreSQL'],
          tools: ['Git', 'Docker', 'AWS', 'Linux', 'Vite', 'Postman'],
        },
        certificates:
          certRes.length > 0
            ? certRes.map((c) => ({
                id: String(c.id),
                title: c.title,
                issuer: c.issuing_organization || 'CampusSphere Credential Cell',
                date: c.issued_date ? c.issued_date.substring(0, 7) : '2025-11',
              }))
            : [
                {
                  id: 'cert-1',
                  title: 'AWS Certified Cloud Practitioner',
                  issuer: 'Amazon Web Services (AWS)',
                  date: 'Dec 2025',
                },
                {
                  id: 'cert-2',
                  title: 'Full-Stack Software Architecture Specialization',
                  issuer: 'Google Career Certificates',
                  date: 'Aug 2025',
                },
              ],
      };

      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          setResumeData({
            ...baseData,
            ...parsed,
            personal: { ...baseData.personal, ...(parsed.personal || {}) },
            skills: { ...baseData.skills, ...(parsed.skills || {}) },
          });
        } catch {
          setResumeData(baseData);
        }
      } else if (profRes && (profRes as any).resume_data) {
        const dbResume = (profRes as any).resume_data;
        setResumeData({
          ...baseData,
          ...dbResume,
          personal: { ...baseData.personal, ...(dbResume.personal || {}) },
          skills: { ...baseData.skills, ...(dbResume.skills || {}) },
        });
      } else {
        setResumeData(baseData);
      }
    } catch (err) {
      console.error('Error initializing resume data:', err);
      toast.error('Could not load profile details', 'Initialized starter template.');
    } finally {
      setLoading(false);
    }
  }, [STORAGE_KEY, SETTINGS_KEY, toast]);

  useEffect(() => {
    loadResumeData();
  }, [loadResumeData]);

  // Debounced Autosave to localStorage & Supabase DB (1.2s debounce)
  useEffect(() => {
    if (loading) return;
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(resumeData));
        localStorage.setItem(
          SETTINGS_KEY,
          JSON.stringify({
            template,
            accentColor,
            fontFamily,
            density,
            documentTitle,
            sectionsOrder,
          })
        );
        if (user?.id) {
          supabase
            .from('students')
            .update({
              resume_data: resumeData,
              resume_url: `${window.location.origin}/resume-builder`,
            })
            .eq('user_id', user.id)
            .then(({ error }) => {
              if (error) console.warn('Non-fatal: could not sync resume to DB:', error.message);
            });
        }
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave failed:', err);
        setSaveStatus('unsaved');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [resumeData, template, accentColor, fontFamily, density, documentTitle, sectionsOrder, loading, STORAGE_KEY, SETTINGS_KEY, user]);

  // One-click profile refresh from Supabase
  const handleSyncProfile = async () => {
    setIsSyncingProfile(true);
    try {
      const [profRes, skillsRes, projRes, certRes] = await Promise.all([
        studentService.getMyProfile().catch(() => null),
        skillService.getSkills().catch(() => []),
        projectService.getProjects().catch(() => []),
        certificateService.getMyCertificates().catch(() => []),
      ]);

      if (!profRes) {
        toast.warning('Profile Incomplete', 'Could not find university student profile.');
        return;
      }

      setResumeData((prev) => ({
        ...prev,
        personal: {
          ...prev.personal,
          fullName: profRes?.user?.first_name
            ? `${profRes.user.first_name} ${profRes.user.last_name || ''}`.trim()
            : prev.personal.fullName,
          headline: profRes?.course
            ? `${profRes.course} · ${profRes.department?.name || 'Computer Science'}`
            : prev.personal.headline,
          email: profRes?.user?.email || prev.personal.email,
          phone: profRes?.user?.phone_number || prev.personal.phone,
          githubUrl: profRes?.github_url || prev.personal.githubUrl,
          linkedinUrl: profRes?.linkedin_url || prev.personal.linkedinUrl,
        },
        skills: {
          ...prev.skills,
          programming:
            skillsRes.length > 0
              ? Array.from(new Set([...prev.skills.programming, ...skillsRes.map((s) => s.name)]))
              : prev.skills.programming,
        },
        projects:
          projRes.length > 0
            ? projRes.map((p) => ({
                id: String(p.id),
                title: p.title,
                technologies: p.technologies || 'React, TypeScript',
                demoLink: p.github_link || p.demo_link || '',
                description: p.description,
              }))
            : prev.projects,
        certificates:
          certRes.length > 0
            ? certRes.map((c) => ({
                id: String(c.id),
                title: c.title,
                issuer: c.issuing_organization || 'CampusSphere',
                date: c.issued_date ? c.issued_date.substring(0, 7) : '',
              }))
            : prev.certificates,
      }));

      toast.success('Synced with Campus Profile', 'Imported verified credentials and projects.');
    } catch (err: any) {
      toast.error('Sync failed', err?.message || 'Check connection.');
    } finally {
      setIsSyncingProfile(false);
    }
  };

  // High-Res PDF Export Pipeline via html2pdf.js
  const handleExportPdf = async () => {
    const el = document.getElementById('resume-a4-document');
    if (!el) {
      toast.error('Export Error', 'Preview document was not found.');
      return;
    }

    setIsExporting(true);
    toast.info('Generating PDF', 'Preparing high-resolution document...');

    try {
      const originalTransform = el.style.transform;
      const originalBoxShadow = el.style.boxShadow;
      el.style.transform = 'none';
      el.style.boxShadow = 'none';

      const fileName = `${(resumeData.personal.fullName || 'CampusSphere_Resume').replace(/\s+/g, '_')}.pdf`;

      const opt = {
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
          scrollY: 0,
          scrollX: 0,
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await html2pdf().set(opt).from(el).save();

      el.style.transform = originalTransform;
      el.style.boxShadow = originalBoxShadow;

      toast.success('Resume Downloaded!', `Saved as ${fileName}`);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      toast.error('Export Failed', 'Could not generate PDF. You can also use browser Print.');
    } finally {
      setIsExporting(false);
    }
  };

  // Scoped Print Mode
  const handlePrint = () => {
    window.print();
  };

  // Calculate dynamic auto-fit scale for the Live Drafting Desk
  const computedScale = useMemo(() => {
    if (userZoom !== 'fit') return userZoom;
    const paddingOffset = 32; // padding inside preview container
    const available = Math.max(240, containerWidth - paddingOffset);
    const fitRatio = available / A4_WIDTH_PX;
    return Math.min(1.05, Math.max(0.30, Number(fitRatio.toFixed(2))));
  }, [userZoom, containerWidth]);

  // Reorder Sections Helper
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sectionsOrder.length) return;
    const newOrder = [...sectionsOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    setSectionsOrder(newOrder);
    toast.info('Section Reordered', `Moved ${temp} ${direction}.`);
  };

  // Generic reorder item helper (Experience, Education, Projects, Certs)
  const moveListItem = (
    listName: 'experience' | 'education' | 'projects' | 'certificates',
    index: number,
    direction: 'up' | 'down'
  ) => {
    const list = [...resumeData[listName]];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    setResumeData((prev) => ({ ...prev, [listName]: list }));
  };

  // Action Verb Quick Inserter
  const insertActionVerb = (
    verb: string,
    listName: 'experience' | 'projects',
    itemId: string
  ) => {
    setResumeData((prev) => {
      const items = (prev[listName] as any[]).map((item) => {
        if (item.id === itemId) {
          const current = item.description || '';
          const addition = current ? `\n• ${verb} ` : `• ${verb} `;
          return { ...item, description: current + addition };
        }
        return item;
      });
      return { ...prev, [listName]: items };
    });
    toast.success('Action Verb Inserted', `Added "${verb}" to bullet points.`);
  };

  // Word Count & Character Count calculation
  const documentMetrics = useMemo(() => {
    const textPieces = [
      resumeData.personal.fullName,
      resumeData.personal.headline,
      resumeData.summary,
      ...resumeData.experience.map((e) => `${e.title} ${e.company} ${e.description}`),
      ...resumeData.education.map((e) => `${e.degree} ${e.institution}`),
      ...resumeData.projects.map((p) => `${p.title} ${p.technologies} ${p.description}`),
      ...resumeData.skills.programming,
      ...resumeData.skills.web,
      ...resumeData.skills.tools,
      ...resumeData.certificates.map((c) => `${c.title} ${c.issuer}`),
    ];
    const fullText = textPieces.join(' ');
    const words = fullText.split(/\s+/).filter(Boolean).length;
    const chars = fullText.length;
    const readingTimeSec = Math.max(15, Math.ceil((words / 200) * 60));
    return { words, chars, readingTimeSec };
  }, [resumeData]);

  // ATS Optimization Score & Criteria Checklist
  const atsAnalysis = useMemo(() => {
    let score = 0;
    const checks: { id: string; label: string; passed: boolean; tip: string; points: number }[] = [];

    // 1. Personal Contact Info
    const hasContact =
      Boolean(resumeData.personal.fullName.trim()) &&
      Boolean(resumeData.personal.email.trim()) &&
      Boolean(resumeData.personal.phone.trim());
    checks.push({
      id: 'contact',
      label: 'Complete Contact Details (Name, Email, Phone)',
      passed: hasContact,
      tip: 'Provide a verified email and telephone number so recruiters can reach you.',
      points: 20,
    });
    if (hasContact) score += 20;

    // 2. Links (LinkedIn or GitHub)
    const hasLinks =
      Boolean(resumeData.personal.linkedinUrl.trim()) || Boolean(resumeData.personal.githubUrl.trim());
    checks.push({
      id: 'links',
      label: 'Professional Profile Links (LinkedIn or GitHub)',
      passed: hasLinks,
      tip: 'Recruiters check your code repositories and professional network.',
      points: 10,
    });
    if (hasLinks) score += 10;

    // 3. Professional Summary Depth
    const summaryWords = resumeData.summary.split(/\s+/).filter(Boolean).length;
    const hasSummary = summaryWords >= 30;
    checks.push({
      id: 'summary',
      label: 'Executive Summary (30+ Words)',
      passed: hasSummary,
      tip: `Current summary has ${summaryWords} words. Aim for 30–70 words highlighting core strengths.`,
      points: 15,
    });
    if (hasSummary) score += 15;

    // 4. Work Experience or Key Projects
    const totalExperiences = resumeData.experience.length + resumeData.projects.length;
    const hasExpOrProj = totalExperiences >= 2;
    checks.push({
      id: 'experience',
      label: 'At least 2 Work Experiences or Key Projects',
      passed: hasExpOrProj,
      tip: 'Add internships, research projects, or open-source builds to demonstrate execution.',
      points: 20,
    });
    if (hasExpOrProj) score += 20;

    // 5. Action Verbs in Descriptions
    const allDescriptions = [
      ...resumeData.experience.map((e) => e.description),
      ...resumeData.projects.map((p) => p.description),
    ].join(' ').toLowerCase();
    const actionVerbMatches = ACTION_VERBS.filter((v) => allDescriptions.includes(v.toLowerCase()));
    const hasActionVerbs = actionVerbMatches.length >= 2;
    checks.push({
      id: 'action_verbs',
      label: 'Impact Action Verbs (Spearheaded, Architected, etc.)',
      passed: hasActionVerbs,
      tip: `Used ${actionVerbMatches.length} recommended action verbs. Try adding words like "Optimized" or "Automated".`,
      points: 15,
    });
    if (hasActionVerbs) score += 15;

    // 6. Technical Skills Categorization
    const totalSkills =
      resumeData.skills.programming.length +
      resumeData.skills.web.length +
      resumeData.skills.tools.length;
    const hasSkills = totalSkills >= 5;
    checks.push({
      id: 'skills',
      label: 'Comprehensive Skills Stack (5+ Technologies)',
      passed: hasSkills,
      tip: 'List programming languages, web frameworks, and cloud/developer tooling.',
      points: 10,
    });
    if (hasSkills) score += 10;

    // 7. Education with CGPA
    const hasEducation = resumeData.education.length > 0;
    checks.push({
      id: 'education',
      label: 'Academic Qualification & Degree Institution',
      passed: hasEducation,
      tip: 'List your current university program and expected graduation year.',
      points: 10,
    });
    if (hasEducation) score += 10;

    return { score: Math.min(100, score), checks };
  }, [resumeData]);

  // Section completion check
  const isSectionComplete = (key: SectionKey): boolean => {
    switch (key) {
      case 'personal':
        return Boolean(resumeData.personal.fullName && resumeData.personal.email);
      case 'summary':
        return Boolean(resumeData.summary.trim().length > 30);
      case 'experience':
        return resumeData.experience.length > 0;
      case 'education':
        return resumeData.education.length > 0;
      case 'projects':
        return resumeData.projects.length > 0;
      case 'skills':
        return (
          resumeData.skills.programming.length > 0 ||
          resumeData.skills.web.length > 0 ||
          resumeData.skills.tools.length > 0
        );
      case 'certificates':
        return resumeData.certificates.length > 0;
      default:
        return false;
    }
  };

  // Section item count badge
  const getSectionItemCount = (key: SectionKey): number | null => {
    switch (key) {
      case 'experience':
        return resumeData.experience.length;
      case 'education':
        return resumeData.education.length;
      case 'projects':
        return resumeData.projects.length;
      case 'skills':
        return (
          resumeData.skills.programming.length +
          resumeData.skills.web.length +
          resumeData.skills.tools.length
        );
      case 'certificates':
        return resumeData.certificates.length;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-6 sm:p-10 space-y-6 max-w-7xl mx-auto">
        <LoadingSkeleton className="h-14 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <LoadingSkeleton className="h-96 rounded-2xl" />
          </div>
          <div className="lg:col-span-9">
            <LoadingSkeleton className="h-[750px] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-950 flex flex-col font-sans text-slate-900 dark:text-slate-100">
      {/* ── TOP STUDIO COMMAND BAR ───────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0a0c16]/95 backdrop-blur-md border-b border-slate-200 dark:border-violet-500/15 px-4 sm:px-6 py-2.5 shadow-xs">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Back Link & Document Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/dashboard/student"
              className="h-9 w-9 rounded-xl flex items-center justify-center border border-slate-200 dark:border-violet-500/20 bg-slate-50 dark:bg-[#111425] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#171b32] transition-colors shrink-0"
              title="Return to Student Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="min-w-0">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  autoFocus
                  className="text-sm sm:text-base font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-indigo-400 focus:outline-none"
                />
              ) : (
                <div
                  onClick={() => setIsEditingTitle(true)}
                  className="group flex items-center gap-1.5 cursor-pointer"
                  title="Click to rename resume"
                >
                  <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
                    {documentTitle}
                  </h1>
                  <Edit3 className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}

              {/* Status pills: Autosave & Metrics */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="inline-flex items-center gap-1 font-medium">
                  {saveStatus === 'saving' ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Saving changes…
                    </>
                  ) : saveStatus === 'saved' ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Autosaved
                    </>
                  ) : (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      Unsaved edits
                    </>
                  )}
                </span>
                <span>•</span>
                <span className="hidden md:inline">{documentMetrics.words} words</span>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:inline">{documentMetrics.readingTimeSec}s read</span>
              </div>
            </div>
          </div>

          {/* Center: View Switcher (Studio / Full Canvas / ATS Optimizer) */}
          <div className="hidden lg:flex items-center bg-slate-100 dark:bg-gray-800 p-1 rounded-xl border border-slate-200 dark:border-gray-700 shadow-inner">
            <button
              onClick={() => setActiveView('studio')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'studio'
                  ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              Studio Editor
            </button>
            <button
              onClick={() => setActiveView('canvas')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'canvas'
                  ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Full Canvas
            </button>
            <button
              onClick={() => setActiveView('ats')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'ats'
                  ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              ATS Score
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                {atsAnalysis.score}%
              </span>
            </button>
          </div>

          {/* Right: Actions (Sync Profile, Print, Export PDF) */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncProfile}
              disabled={isSyncingProfile}
              className="hidden sm:inline-flex text-xs font-bold gap-1.5 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-gray-700 hover:bg-slate-50"
            >
              <Sparkles className={`h-3.5 w-3.5 text-indigo-600 ${isSyncingProfile ? 'animate-spin' : ''}`} />
              {isSyncingProfile ? 'Syncing…' : 'Sync Profile'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="hidden md:inline-flex text-xs font-bold gap-1.5 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-gray-700"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="text-xs font-black gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md shadow-indigo-500/20"
            >
              <Download className="h-3.5 w-3.5" />
              {isExporting ? 'Exporting PDF…' : 'Export PDF'}
            </Button>
          </div>
        </div>

        {/* Mobile View Toggle Bar */}
        <div className="lg:hidden flex items-center justify-between border-t border-slate-200 dark:border-gray-800 mt-2.5 pt-2">
          <div className="grid grid-cols-3 w-full gap-1">
            <button
              onClick={() => setMobileTab('editor')}
              className={`py-1.5 text-xs font-bold rounded-lg text-center ${
                mobileTab === 'editor'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-gray-800'
              }`}
            >
              Form Editor
            </button>
            <button
              onClick={() => setMobileTab('preview')}
              className={`py-1.5 text-xs font-bold rounded-lg text-center ${
                mobileTab === 'preview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-gray-800'
              }`}
            >
              Live A4 ({pageCount}P)
            </button>
            <button
              onClick={() => setMobileTab('ats')}
              className={`py-1.5 text-xs font-bold rounded-lg text-center ${
                mobileTab === 'ats'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-gray-800'
              }`}
            >
              ATS ({atsAnalysis.score}%)
            </button>
          </div>
        </div>
      </header>

      {/* ── ATS OPTIMIZER MODAL/TAB ───────────────────────────── */}
      {activeView === 'ats' && (
        <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 animate-fade-in space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-gray-800">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 inline-flex items-center gap-1.5 mb-2">
                  <Zap className="h-3 w-3" />
                  Real-Time Placement & ATS Readiness Engine
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Resume ATS Readiness Score
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                  Automated applicant tracking system (ATS) screening simulation based on university placement benchmarks and recruiter heuristics.
                </p>
              </div>

              {/* Big Score Dial */}
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-gray-800/60 p-5 rounded-2xl border border-slate-200 dark:border-gray-700">
                <div className="relative h-20 w-20 flex items-center justify-center">
                  <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200 dark:text-gray-700"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={
                        atsAnalysis.score >= 85
                          ? 'text-emerald-500'
                          : atsAnalysis.score >= 60
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }
                      strokeDasharray={`${atsAnalysis.score}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-xl font-black text-slate-900 dark:text-white">
                    {atsAnalysis.score}%
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {atsAnalysis.score >= 85
                      ? 'Placement Ready'
                      : atsAnalysis.score >= 60
                      ? 'Good Foundation'
                      : 'Needs Refinement'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {atsAnalysis.checks.filter((c) => c.passed).length} of {atsAnalysis.checks.length} criteria passed
                  </p>
                </div>
              </div>
            </div>

            {/* Checklist items */}
            <div className="mt-6 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Evaluation Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {atsAnalysis.checks.map((check) => (
                  <div
                    key={check.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      check.passed
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200/80 dark:border-emerald-800/30'
                        : 'bg-rose-50/40 dark:bg-rose-950/10 border-rose-200/80 dark:border-rose-800/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          check.passed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {check.passed ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {check.label}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400 shrink-0">
                            +{check.points} pts
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {check.tip}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-gray-800 flex justify-end">
              <Button
                variant="primary"
                onClick={() => setActiveView('studio')}
                className="text-xs font-bold gap-2"
              >
                Back to Studio Editor
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN WORKSPACE (Studio / Canvas) ─────────────────── */}
      {activeView !== 'ats' && (
        <main className="flex-1 flex overflow-hidden">
          {/* ═══════════════════════════════════════════════════════
              LEFT RAIL: SECTION NAVIGATION & DOCUMENT STYLING
             ═══════════════════════════════════════════════════════ */}
          <aside
            className={`w-72 lg:w-80 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-white/10 flex-col shrink-0 overflow-y-auto ${
              activeView === 'canvas' ? 'hidden' : 'hidden lg:flex'
            }`}
          >
            {/* Template & Visual Styling Card */}
            <div className="p-4 border-b border-slate-200 dark:border-gray-800 space-y-3.5 bg-slate-50/50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                  Template & Style
                </span>
                <span className="text-[10px] font-bold text-slate-400">4 Styles</span>
              </div>

              {/* Template Picker */}
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'executive', name: 'Executive', desc: 'Top Accent Line' },
                  { id: 'classic', name: 'Classic', desc: 'Stanford Serif' },
                  { id: 'tech_two_column', name: 'Tech 2-Col', desc: 'Developer Split' },
                  { id: 'minimal', name: 'Minimal', desc: 'High Density' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id as ResumeTemplateId)}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      template === t.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-xs'
                        : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold leading-tight">{t.name}</div>
                    <div className="text-[9px] text-slate-400 leading-tight mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>

              {/* Accent Color Palette */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Accent Color
                </span>
                <div className="flex items-center gap-2">
                  {(
                    [
                      { id: 'indigo', color: '#4f46e5' },
                      { id: 'blue', color: '#2563eb' },
                      { id: 'emerald', color: '#059669' },
                      { id: 'rose', color: '#e11d48' },
                      { id: 'slate', color: '#334155' },
                      { id: 'violet', color: '#7c3aed' },
                    ] as const
                  ).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setAccentColor(c.id)}
                      className={`h-6 w-6 rounded-full transition-transform flex items-center justify-center ${
                        accentColor === c.id ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.id}
                    >
                      {accentColor === c.id && <Check className="h-3 w-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography & Density Mode */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Font Family
                  </label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value as FontFamilyId)}
                    className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="sans">Modern Sans (Inter)</option>
                    <option value="serif">Academic (Georgia)</option>
                    <option value="mono">Tech Mono (Code)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Density / Margins
                  </label>
                  <select
                    value={density}
                    onChange={(e) => setDensity(e.target.value as DensityMode)}
                    className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="compact">Compact (Fit 1 Page)</option>
                    <option value="standard">Standard</option>
                    <option value="spacious">Spacious</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section Quick Jump & Reordering */}
            <div className="p-3 flex-1 space-y-1">
              <div className="px-2 py-1 flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400">
                <span>Resume Sections</span>
                <span className="text-[10px] font-normal text-slate-400">Reorder with ↑↓</span>
              </div>

              {sectionsOrder.map((secKey, index) => {
                const config = DEFAULT_SECTIONS.find((s) => s.id === secKey)!;
                const Icon = config.icon;
                const completed = isSectionComplete(secKey);
                const itemCount = getSectionItemCount(secKey);
                const isActive = activeSection === secKey;

                return (
                  <div
                    key={secKey}
                    onMouseEnter={() => setHighlightedSection(secKey)}
                    onMouseLeave={() => setHighlightedSection(null)}
                    className={`group flex items-center justify-between rounded-xl px-2.5 py-2 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25'
                        : 'hover:bg-slate-100 dark:hover:bg-[#171b32] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div
                      onClick={() => setActiveSection(secKey)}
                      className="flex items-center gap-2.5 flex-1 min-w-0"
                    >
                      <div
                        className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : completed
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                            : 'bg-slate-100 dark:bg-gray-800 text-slate-400'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate leading-tight">
                          {config.label}
                        </div>
                        <div
                          className={`text-[10px] truncate leading-tight ${
                            isActive ? 'text-white/80' : 'text-slate-400'
                          }`}
                        >
                          {config.description}
                        </div>
                      </div>
                    </div>

                    {/* Right indicators & Up/Down Arrows */}
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {itemCount !== null && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200 dark:bg-gray-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {itemCount}
                        </span>
                      )}

                      {completed && !isActive && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      )}

                      {/* Move Up/Down Controls */}
                      <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(index, 'up');
                          }}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-black/10 disabled:opacity-30"
                          title="Move section up"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(index, 'down');
                          }}
                          disabled={index === sectionsOrder.length - 1}
                          className="p-1 rounded hover:bg-black/10 disabled:opacity-30"
                          title="Move section down"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* ═══════════════════════════════════════════════════════
              CENTER FORM CANVAS (Active Section Editor)
             ═══════════════════════════════════════════════════════ */}
          <div
            className={`flex-1 bg-white dark:bg-gray-900 overflow-y-auto p-4 sm:p-6 lg:p-8 ${
              activeView === 'canvas' ? 'hidden' : mobileTab === 'preview' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6">
              {/* Mobile Horizontal Section Selector Bar */}
              <div className="lg:hidden space-y-2 pb-3 border-b border-slate-100 dark:border-gray-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Jump To Section</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                    {ALL_MOBILE_SECTIONS.find(s => s.id === activeSection)?.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 touch-pan-x -mx-1 px-1">
                  {ALL_MOBILE_SECTIONS.map((sec) => {
                    const Icon = sec.icon;
                    const isSelected = activeSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setActiveSection(sec.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all touch-manipulation shrink-0 ${
                          isSelected
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{sec.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section Header with Step Context */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-gray-800">
                <div>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Editing Section
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white capitalize">
                    {activeSection === 'style'
                      ? 'Template & Visual Styling'
                      : DEFAULT_SECTIONS.find((s) => s.id === activeSection)?.label}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">
                    {sectionsOrder.indexOf(activeSection as any) >= 0
                      ? `${sectionsOrder.indexOf(activeSection as any) + 1} of ${sectionsOrder.length}`
                      : 'Styling'}
                  </span>
                </div>
              </div>

              {/* ── 1. PERSONAL INFO SECTION ──────────────────── */}
              {activeSection === 'personal' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Legal Name"
                      value={resumeData.personal.fullName}
                      onChange={(e) =>
                        setResumeData((prev) => ({
                          ...prev,
                          personal: { ...prev.personal, fullName: e.target.value },
                        }))
                      }
                      placeholder="Aarav Sharma"
                      required
                    />
                    <Input
                      label="Headline / Professional Title"
                      value={resumeData.personal.headline}
                      onChange={(e) =>
                        setResumeData((prev) => ({
                          ...prev,
                          personal: { ...prev.personal, headline: e.target.value },
                        }))
                      }
                      placeholder="B.Tech in Computer Science · Full-Stack Engineer"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Institutional Email"
                      type="email"
                      value={resumeData.personal.email}
                      onChange={(e) =>
                        setResumeData((prev) => ({
                          ...prev,
                          personal: { ...prev.personal, email: e.target.value },
                        }))
                      }
                      placeholder="aarav.sharma@campus.edu"
                      required
                    />
                    <Input
                      label="Phone Number"
                      value={resumeData.personal.phone}
                      onChange={(e) =>
                        setResumeData((prev) => ({
                          ...prev,
                          personal: { ...prev.personal, phone: e.target.value },
                        }))
                      }
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <Input
                    label="Current Location (City, State)"
                    value={resumeData.personal.location}
                    onChange={(e) =>
                      setResumeData((prev) => ({
                        ...prev,
                        personal: { ...prev.personal, location: e.target.value },
                      }))
                    }
                    placeholder="Pune, Maharashtra"
                  />

                  <div className="pt-2 border-t border-slate-100 dark:border-gray-800 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Professional Links & Repositories
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        label="LinkedIn URL"
                        value={resumeData.personal.linkedinUrl}
                        onChange={(e) =>
                          setResumeData((prev) => ({
                            ...prev,
                            personal: { ...prev.personal, linkedinUrl: e.target.value },
                          }))
                        }
                        placeholder="linkedin.com/in/aaravsharma"
                      />
                      <Input
                        label="GitHub Profile"
                        value={resumeData.personal.githubUrl}
                        onChange={(e) =>
                          setResumeData((prev) => ({
                            ...prev,
                            personal: { ...prev.personal, githubUrl: e.target.value },
                          }))
                        }
                        placeholder="github.com/aaravsharma"
                      />
                      <Input
                        label="Portfolio / Website"
                        value={resumeData.personal.portfolioUrl}
                        onChange={(e) =>
                          setResumeData((prev) => ({
                            ...prev,
                            personal: { ...prev.personal, portfolioUrl: e.target.value },
                          }))
                        }
                        placeholder="aaravsharma.dev"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 2. SUMMARY SECTION ───────────────────────── */}
              {activeSection === 'summary' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Executive Summary / Career Objective
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {resumeData.summary.split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>

                  <Textarea
                    value={resumeData.summary}
                    onChange={(e) =>
                      setResumeData((prev) => ({ ...prev, summary: e.target.value }))
                    }
                    rows={6}
                    placeholder="Driven and detail-oriented Computer Science student with a strong foundation in software engineering, web architectures, and scalable cloud systems..."
                  />

                  {/* Smart Tips */}
                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/40 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      ATS Tip for Students:
                    </div>
                    Recruiters scan this section in 6 seconds. Highlight your major degree, target role (e.g. Full-Stack, Cloud Engineer), and 2-3 core strengths with impact metrics.
                  </div>
                </div>
              )}

              {/* ── 3. WORK EXPERIENCE SECTION ───────────────── */}
              {activeSection === 'experience' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-500">
                      Add internships, contract roles, or teaching assistantships.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        setResumeData((prev) => ({
                          ...prev,
                          experience: [
                            ...prev.experience,
                            {
                              id: `exp-${Date.now()}`,
                              title: 'Software Engineer Intern',
                              company: 'Company Name',
                              location: 'City, State',
                              startDate: 'Jan 2026',
                              endDate: 'Present',
                              description: '• Engineered and deployed...',
                            },
                          ],
                        }))
                      }
                      className="text-xs font-bold gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Role
                    </Button>
                  </div>

                  {resumeData.experience.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-gray-800 rounded-2xl">
                      <Briefcase className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        No work experience added yet
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Freshers can highlight open-source contributions or academic research roles.
                      </p>
                    </div>
                  ) : (
                    resumeData.experience.map((exp, idx) => (
                      <div
                        key={exp.id}
                        className="p-5 rounded-2xl border border-slate-200 dark:border-gray-800 bg-slate-50/40 dark:bg-gray-800/40 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                            Role #{idx + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => moveListItem('experience', idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#1f2444] disabled:opacity-30"
                              title="Move up"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => moveListItem('experience', idx, 'down')}
                              disabled={idx === resumeData.experience.length - 1}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#1f2444] disabled:opacity-30"
                              title="Move down"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setResumeData((prev) => ({
                                  ...prev,
                                  experience: prev.experience.filter((e) => e.id !== exp.id),
                                }))
                              }
                              className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 ml-1"
                              title="Delete entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            label="Job Title / Role"
                            value={exp.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResumeData((prev) => ({
                                ...prev,
                                experience: prev.experience.map((item) =>
                                  item.id === exp.id ? { ...item, title: val } : item
                                ),
                              }));
                            }}
                            placeholder="Frontend Engineering Intern"
                          />
                          <Input
                            label="Company / Organization"
                            value={exp.company}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResumeData((prev) => ({
                                ...prev,
                                experience: prev.experience.map((item) =>
                                  item.id === exp.id ? { ...item, company: val } : item
                                ),
                              }));
                            }}
                            placeholder="Infosys / TechNova"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Input
                            label="Location"
                            value={exp.location}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResumeData((prev) => ({
                                ...prev,
                                experience: prev.experience.map((item) =>
                                  item.id === exp.id ? { ...item, location: val } : item
                                ),
                              }));
                            }}
                            placeholder="Pune, India"
                          />
                          <Input
                            label="Start Date"
                            value={exp.startDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResumeData((prev) => ({
                                ...prev,
                                experience: prev.experience.map((item) =>
                                  item.id === exp.id ? { ...item, startDate: val } : item
                                ),
                              }));
                            }}
                            placeholder="May 2025"
                          />
                          <Input
                            label="End Date"
                            value={exp.endDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResumeData((prev) => ({
                                ...prev,
                                experience: prev.experience.map((item) =>
                                  item.id === exp.id ? { ...item, endDate: val } : item
                                ),
                              }));
                            }}
                            placeholder="Aug 2025 or Present"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                              Key Accomplishments & Responsibilities (Bullet points)
                            </label>
                            <span className="text-[10px] text-slate-400">One bullet per line</span>
                          </div>

                          {/* Action Verb Quick Palette */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <span className="text-[10px] font-bold text-slate-500">Insert Verb:</span>
                            {ACTION_VERBS.slice(0, 5).map((verb) => (
                              <button
                                key={verb}
                                type="button"
                                onClick={() => insertActionVerb(verb, 'experience', exp.id)}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-indigo-600 dark:text-indigo-400 hover:border-indigo-400"
                              >
                                + {verb}
                              </button>
                            ))}
                          </div>

                          <Textarea
                            value={exp.description}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResumeData((prev) => ({
                                ...prev,
                                experience: prev.experience.map((item) =>
                                  item.id === exp.id ? { ...item, description: val } : item
                                ),
                              }));
                            }}
                            rows={4}
                            placeholder="• Developed RESTful endpoints in TypeScript, improving throughput by 25%..."
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── 4. EDUCATION SECTION ─────────────────────── */}
              {activeSection === 'education' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-500">
                      Include high school or undergraduate university credentials.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        setResumeData((prev) => ({
                          ...prev,
                          education: [
                            ...prev.education,
                            {
                              id: `edu-${Date.now()}`,
                              institution: 'University / Institute Name',
                              degree: 'B.Tech in Computer Science',
                              cgpa: '8.5 / 10.0',
                              startYear: '2023',
                              endYear: '2027',
                            },
                          ],
                        }))
                      }
                      className="text-xs font-bold gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Degree
                    </Button>
                  </div>

                  {resumeData.education.map((edu, idx) => (
                    <div
                      key={edu.id}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-gray-800 bg-slate-50/40 dark:bg-gray-800/40 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                          Degree #{idx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveListItem('education', idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#1f2444] disabled:opacity-30"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => moveListItem('education', idx, 'down')}
                            disabled={idx === resumeData.education.length - 1}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#1f2444] disabled:opacity-30"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setResumeData((prev) => ({
                                ...prev,
                                education: prev.education.filter((e) => e.id !== edu.id),
                              }))
                            }
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 ml-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <Input
                        label="Institution / University"
                        value={edu.institution}
                        onChange={(e) => {
                          const val = e.target.value;
                          setResumeData((prev) => ({
                            ...prev,
                            education: prev.education.map((item) =>
                              item.id === edu.id ? { ...item, institution: val } : item
                            ),
                          }));
                        }}
                        placeholder="CampusSphere University Institute of Technology"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input
                          label="Degree & Major"
                          value={edu.degree}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResumeData((prev) => ({
                              ...prev,
                              education: prev.education.map((item) =>
                                item.id === edu.id ? { ...item, degree: val } : item
                              ),
                            }));
                          }}
                          placeholder="B.Tech in Computer Science"
                        />
                        <Input
                          label="CGPA / Score"
                          value={edu.cgpa}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResumeData((prev) => ({
                              ...prev,
                              education: prev.education.map((item) =>
                                item.id === edu.id ? { ...item, cgpa: val } : item
                              ),
                            }));
                          }}
                          placeholder="8.92 / 10.0"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            label="Start"
                            value={edu.startYear}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResumeData((prev) => ({
                                ...prev,
                                education: prev.education.map((item) =>
                                  item.id === edu.id ? { ...item, startYear: val } : item
                                ),
                              }));
                            }}
                            placeholder="2023"
                          />
                          <Input
                            label="End"
                            value={edu.endYear}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResumeData((prev) => ({
                                ...prev,
                                education: prev.education.map((item) =>
                                  item.id === edu.id ? { ...item, endYear: val } : item
                                ),
                              }));
                            }}
                            placeholder="2027"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── 5. PROJECTS SECTION ──────────────────────── */}
              {activeSection === 'projects' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-500">
                      Showcase technical architectures, open-source repos, and hackathon wins.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        setResumeData((prev) => ({
                          ...prev,
                          projects: [
                            ...prev.projects,
                            {
                              id: `proj-${Date.now()}`,
                              title: 'Project Title',
                              technologies: 'React, Node.js, PostgreSQL',
                              demoLink: 'github.com/my-project',
                              description: '• Engineered full-stack solution...',
                            },
                          ],
                        }))
                      }
                      className="text-xs font-bold gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Project
                    </Button>
                  </div>

                  {resumeData.projects.map((proj, idx) => (
                    <div
                      key={proj.id}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-gray-800 bg-slate-50/40 dark:bg-gray-800/40 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                          Project #{idx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveListItem('projects', idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#1f2444] disabled:opacity-30"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => moveListItem('projects', idx, 'down')}
                            disabled={idx === resumeData.projects.length - 1}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#1f2444] disabled:opacity-30"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setResumeData((prev) => ({
                                ...prev,
                                projects: prev.projects.filter((p) => p.id !== proj.id),
                              }))
                            }
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 ml-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Project Name"
                          value={proj.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResumeData((prev) => ({
                              ...prev,
                              projects: prev.projects.map((item) =>
                                item.id === proj.id ? { ...item, title: val } : item
                              ),
                            }));
                          }}
                          placeholder="CampusSphere Portal"
                        />
                        <Input
                          label="Live URL or Repository"
                          value={proj.demoLink}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResumeData((prev) => ({
                              ...prev,
                              projects: prev.projects.map((item) =>
                                item.id === proj.id ? { ...item, demoLink: val } : item
                              ),
                            }));
                          }}
                          placeholder="github.com/username/project"
                        />
                      </div>

                      <Input
                        label="Technologies Used"
                        value={proj.technologies}
                        onChange={(e) => {
                          const val = e.target.value;
                          setResumeData((prev) => ({
                            ...prev,
                            projects: prev.projects.map((item) =>
                              item.id === proj.id ? { ...item, technologies: val } : item
                            ),
                          }));
                        }}
                        placeholder="React, TypeScript, Tailwind, Supabase"
                      />

                      <div>
                        {/* Action Verb Quick Palette */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <span className="text-[10px] font-bold text-slate-500">Insert Verb:</span>
                          {ACTION_VERBS.slice(0, 5).map((verb) => (
                            <button
                              key={verb}
                              type="button"
                              onClick={() => insertActionVerb(verb, 'projects', proj.id)}
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-indigo-600 dark:text-indigo-400 hover:border-indigo-400"
                            >
                              + {verb}
                            </button>
                          ))}
                        </div>

                        <Textarea
                          label="Project Impact & Architecture Description"
                          value={proj.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResumeData((prev) => ({
                              ...prev,
                              projects: prev.projects.map((item) =>
                                item.id === proj.id ? { ...item, description: val } : item
                              ),
                            }));
                          }}
                          rows={4}
                          placeholder="• Architected full-stack portal serving 4,000 students..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── 6. SKILLS SECTION ────────────────────────── */}
              {activeSection === 'skills' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Programming Languages */}
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-gray-800 bg-slate-50/40 dark:bg-gray-800/40 space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Programming Languages
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {resumeData.skills.programming.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() =>
                              setResumeData((prev) => ({
                                ...prev,
                                skills: {
                                  ...prev.skills,
                                  programming: prev.skills.programming.filter((_, idx) => idx !== i),
                                },
                              }))
                            }
                            className="text-slate-400 hover:text-rose-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newProgSkill}
                        onChange={(e) => setNewProgSkill(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newProgSkill.trim()) {
                            e.preventDefault();
                            setResumeData((prev) => ({
                              ...prev,
                              skills: {
                                ...prev.skills,
                                programming: [...prev.skills.programming, newProgSkill.trim()],
                              },
                            }));
                            setNewProgSkill('');
                          }
                        }}
                        placeholder="Add language (e.g. Python, TypeScript) and press Enter"
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (newProgSkill.trim()) {
                            setResumeData((prev) => ({
                              ...prev,
                              skills: {
                                ...prev.skills,
                                programming: [...prev.skills.programming, newProgSkill.trim()],
                              },
                            }));
                            setNewProgSkill('');
                          }
                        }}
                        className="text-xs"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Web & Frameworks */}
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-gray-800 bg-slate-50/40 dark:bg-gray-800/40 space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Web Frameworks & Databases
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {resumeData.skills.web.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() =>
                              setResumeData((prev) => ({
                                ...prev,
                                skills: {
                                  ...prev.skills,
                                  web: prev.skills.web.filter((_, idx) => idx !== i),
                                },
                              }))
                            }
                            className="text-slate-400 hover:text-rose-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newWebSkill}
                        onChange={(e) => setNewWebSkill(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newWebSkill.trim()) {
                            e.preventDefault();
                            setResumeData((prev) => ({
                              ...prev,
                              skills: {
                                ...prev.skills,
                                web: [...prev.skills.web, newWebSkill.trim()],
                              },
                            }));
                            setNewWebSkill('');
                          }
                        }}
                        placeholder="Add framework (e.g. Next.js, PostgreSQL) and press Enter"
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (newWebSkill.trim()) {
                            setResumeData((prev) => ({
                              ...prev,
                              skills: {
                                ...prev.skills,
                                web: [...prev.skills.web, newWebSkill.trim()],
                              },
                            }));
                            setNewWebSkill('');
                          }
                        }}
                        className="text-xs"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Tools & Cloud */}
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-gray-800 bg-slate-50/40 dark:bg-gray-800/40 space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Developer Tools, Cloud & Systems
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {resumeData.skills.tools.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() =>
                              setResumeData((prev) => ({
                                ...prev,
                                skills: {
                                  ...prev.skills,
                                  tools: prev.skills.tools.filter((_, idx) => idx !== i),
                                },
                              }))
                            }
                            className="text-slate-400 hover:text-rose-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newToolSkill}
                        onChange={(e) => setNewToolSkill(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newToolSkill.trim()) {
                            e.preventDefault();
                            setResumeData((prev) => ({
                              ...prev,
                              skills: {
                                ...prev.skills,
                                tools: [...prev.skills.tools, newToolSkill.trim()],
                              },
                            }));
                            setNewToolSkill('');
                          }
                        }}
                        placeholder="Add tool (e.g. Docker, AWS, Git) and press Enter"
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (newToolSkill.trim()) {
                            setResumeData((prev) => ({
                              ...prev,
                              skills: {
                                ...prev.skills,
                                tools: [...prev.skills.tools, newToolSkill.trim()],
                              },
                            }));
                            setNewToolSkill('');
                          }
                        }}
                        className="text-xs"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 7. CERTIFICATES SECTION ──────────────────── */}
              {activeSection === 'certificates' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-500">
                      Add industry certifications, cloud credentials, or academic distinctions.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        setResumeData((prev) => ({
                          ...prev,
                          certificates: [
                            ...prev.certificates,
                            {
                              id: `cert-${Date.now()}`,
                              title: 'Certification Name',
                              issuer: 'Issuing Organization',
                              date: '2025-10',
                            },
                          ],
                        }))
                      }
                      className="text-xs font-bold gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Certificate
                    </Button>
                  </div>

                  {resumeData.certificates.map((cert, idx) => (
                    <div
                      key={cert.id}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-gray-800 bg-slate-50/40 dark:bg-gray-800/40 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                          Certificate #{idx + 1}
                        </span>
                        <button
                          onClick={() =>
                            setResumeData((prev) => ({
                              ...prev,
                              certificates: prev.certificates.filter((c) => c.id !== cert.id),
                            }))
                          }
                          className="p-1 rounded text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input
                          label="Certificate Title"
                          value={cert.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResumeData((prev) => ({
                              ...prev,
                              certificates: prev.certificates.map((item) =>
                                item.id === cert.id ? { ...item, title: val } : item
                              ),
                            }));
                          }}
                          placeholder="AWS Solutions Architect"
                        />
                        <Input
                          label="Issuing Body"
                          value={cert.issuer}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResumeData((prev) => ({
                              ...prev,
                              certificates: prev.certificates.map((item) =>
                                item.id === cert.id ? { ...item, issuer: val } : item
                              ),
                            }));
                          }}
                          placeholder="Amazon Web Services"
                        />
                        <Input
                          label="Date / Year"
                          value={cert.date}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResumeData((prev) => ({
                              ...prev,
                              certificates: prev.certificates.map((item) =>
                                item.id === cert.id ? { ...item, date: val } : item
                              ),
                            }));
                          }}
                          placeholder="Dec 2025"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── 8. TEMPLATE & STYLE SECTION (Accessible on Mobile) ── */}
              {activeSection === 'style' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/40 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-indigo-600" />
                      Choose Resume Template
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { id: 'executive', name: 'Executive', desc: 'Top Accent Line with Modern Header' },
                        { id: 'classic', name: 'Classic', desc: 'Stanford Serif Academic Structure' },
                        { id: 'tech_two_column', name: 'Tech 2-Col', desc: 'Developer Split with Skills Sidebar' },
                        { id: 'minimal', name: 'Minimal', desc: 'High Density 1-Page Recruiter Layout' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTemplate(t.id as ResumeTemplateId)}
                          className={`p-3 rounded-2xl text-left border transition-all ${
                            template === t.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm ring-2 ring-indigo-500/20'
                              : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-sm font-bold leading-tight">{t.name}</div>
                          <div className="text-xs text-slate-400 leading-tight mt-1">{t.desc}</div>
                        </button>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-gray-700 space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                        Accent Brand Color
                      </label>
                      <div className="flex items-center gap-3 flex-wrap">
                        {(
                          [
                            { id: 'indigo', color: '#4f46e5', label: 'Indigo' },
                            { id: 'blue', color: '#2563eb', label: 'Blue' },
                            { id: 'emerald', color: '#059669', label: 'Emerald' },
                            { id: 'rose', color: '#e11d48', label: 'Rose' },
                            { id: 'slate', color: '#334155', label: 'Slate' },
                            { id: 'violet', color: '#7c3aed', label: 'Violet' },
                          ] as const
                        ).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setAccentColor(c.id)}
                            className={`h-8 w-8 rounded-full transition-transform flex items-center justify-center ${
                              accentColor === c.id ? 'scale-110 ring-4 ring-indigo-500/30' : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: c.color }}
                            title={c.label}
                          >
                            {accentColor === c.id && <Check className="h-4 w-4 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-gray-700">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1.5">
                          Font Typography
                        </label>
                        <select
                          value={fontFamily}
                          onChange={(e) => setFontFamily(e.target.value as FontFamilyId)}
                          className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                        >
                          <option value="sans">Modern Sans (Inter)</option>
                          <option value="serif">Academic (Georgia)</option>
                          <option value="mono">Tech Mono (Code)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1.5">
                          Document Density
                        </label>
                        <select
                          value={density}
                          onChange={(e) => setDensity(e.target.value as DensityMode)}
                          className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                        >
                          <option value="compact">Compact (Fit 1 Page)</option>
                          <option value="standard">Standard Margin</option>
                          <option value="spacious">Spacious Academic</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Navigation Footer (Previous / Next) */}
              <div className="pt-6 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between gap-3">
                {sectionsOrder.indexOf(activeSection as any) > 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currIdx = sectionsOrder.indexOf(activeSection as any);
                      setActiveSection(sectionsOrder[currIdx - 1]);
                    }}
                    className="text-xs font-bold gap-1.5"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Previous
                  </Button>
                ) : (
                  <div />
                )}

                {activeSection !== 'style' && sectionsOrder.indexOf(activeSection as any) < sectionsOrder.length - 1 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const currIdx = sectionsOrder.indexOf(activeSection as any);
                      setActiveSection(sectionsOrder[currIdx + 1]);
                    }}
                    className="text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                  >
                    Next Section
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        setMobileTab('preview');
                      } else {
                        setActiveView('canvas');
                      }
                    }}
                    className="text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview Live Resume
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              RIGHT PANE: LIVE A4 DRAFTING DESK
             ═══════════════════════════════════════════════════════ */}
          <div
            ref={previewContainerRef}
            className={`flex-1 bg-slate-200/70 dark:bg-gray-950 flex flex-col overflow-hidden relative ${
              mobileTab === 'editor' && activeView !== 'canvas' ? 'hidden lg:flex' : 'flex'
            }`}
            style={{
              backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            {/* Floating Top Desk Toolbar */}
            <div className="z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-gray-800 px-2.5 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-indigo-600" />
                  A4 Physical Sheet
                </span>

                {/* Page count pill with warning if multi-page */}
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                    pageCount === 1
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {pageCount === 1 ? (
                    <>
                      <Check className="h-3 w-3" />
                      1 Page (A4 Fitted)
                    </>
                  ) : (
                    <>
                      <Scissors className="h-3 w-3" />
                      {pageCount} Pages (Spills onto Page {pageCount})
                    </>
                  )}
                </span>
              </div>

              {/* Zoom & Display Controls */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  onClick={() => setShowPageCutGuides(!showPageCutGuides)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors touch-manipulation ${
                    showPageCutGuides
                      ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#171b32]'
                  }`}
                  title="Toggle A4 Page Cut Markers"
                >
                  Cut Guides
                </button>

                <div className="h-3.5 w-px bg-slate-300 dark:bg-violet-500/20 mx-0.5 sm:mx-1" />

                <button
                  onClick={() =>
                    setUserZoom((prev) =>
                      typeof prev === 'number' ? Math.max(0.4, Number((prev - 0.1).toFixed(2))) : 0.7
                    )
                  }
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#171b32] text-slate-600 dark:text-slate-300 touch-manipulation"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => setUserZoom('fit')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold touch-manipulation ${
                    userZoom === 'fit'
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-[#171b32] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Fit
                </button>

                <button
                  onClick={() =>
                    setUserZoom((prev) =>
                      typeof prev === 'number' ? Math.min(1.4, Number((prev + 0.1).toFixed(2))) : 0.9
                    )
                  }
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#171b32] text-slate-600 dark:text-slate-300 touch-manipulation"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>

                <span className="text-[11px] font-mono font-semibold text-slate-400 min-w-[2.5rem] sm:min-w-[3rem] text-center">
                  {Math.round(computedScale * 100)}%
                </span>
              </div>
            </div>

            {/* Scrollable Desk Canvas Area */}
            <div className="flex-1 overflow-auto p-2 sm:p-8 flex justify-center items-start touch-pan-x touch-pan-y">
              <div
                style={{
                  width: `${A4_WIDTH_PX * computedScale}px`,
                  minHeight: `${A4_HEIGHT_PX * computedScale}px`,
                }}
                className="transition-all duration-150 relative flex justify-center"
              >
                <ResumePreview
                  ref={resumePrintRef}
                  data={resumeData}
                  template={template}
                  accentColor={accentColor}
                  fontFamily={fontFamily}
                  density={density}
                  scale={computedScale}
                  showPageCutMarkers={showPageCutGuides}
                  highlightedSection={highlightedSection}
                  onPageCountChange={(p) => setPageCount(p)}
                />
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ── PRINT-ONLY STYLES ───────────────────────────────── */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          header, aside, button, nav, footer, .print\\:hidden {
            display: none !important;
          }
          #resume-a4-document {
            box-shadow: none !important;
            transform: none !important;
            width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 10mm 14mm !important;
            page-break-after: auto !important;
          }
          .break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};
