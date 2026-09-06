import React, { forwardRef, useEffect, useRef, useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Globe,
  ExternalLink,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Code,
  Award,
  Scissors,
} from 'lucide-react';

export interface ResumeData {
  personal: {
    fullName: string;
    headline: string;
    email: string;
    phone: string;
    location: string;
    githubUrl: string;
    linkedinUrl: string;
    portfolioUrl: string;
  };
  summary: string;
  education: { id: string; institution: string; degree: string; cgpa: string; startYear: string; endYear: string }[];
  experience: { id: string; title: string; company: string; location: string; startDate: string; endDate: string; description: string }[];
  projects: { id: string; title: string; technologies: string; demoLink: string; description: string }[];
  skills: { programming: string[]; web: string[]; tools: string[] };
  certificates: { id: string; title: string; issuer: string; date: string }[];
}

export type ResumeTemplateId = 'executive' | 'classic' | 'tech_two_column' | 'minimal';
export type AccentColorId = 'indigo' | 'blue' | 'emerald' | 'rose' | 'slate' | 'violet';
export type FontFamilyId = 'sans' | 'serif' | 'mono';
export type DensityMode = 'compact' | 'standard' | 'spacious';

export interface ResumePreviewProps {
  data: ResumeData;
  template?: ResumeTemplateId;
  accentColor?: AccentColorId;
  fontFamily?: FontFamilyId;
  density?: DensityMode;
  scale?: number;
  className?: string;
  isPrintMode?: boolean;
  showPageCutMarkers?: boolean;
  highlightedSection?: string | null;
  onPageCountChange?: (pages: number) => void;
}

// Physical A4 Dimensions at 96 DPI
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

export const ACCENT_COLORS: Record<AccentColorId, { primary: string; secondary: string; light: string; border: string }> = {
  indigo: { primary: '#4f46e5', secondary: '#4338ca', light: '#eef2ff', border: '#c7d2fe' },
  blue: { primary: '#2563eb', secondary: '#1d4ed8', light: '#eff6ff', border: '#bfdbfe' },
  emerald: { primary: '#059669', secondary: '#047857', light: '#ecfdf5', border: '#a7f3d0' },
  rose: { primary: '#e11d48', secondary: '#be123c', light: '#fff1f2', border: '#fecdd3' },
  slate: { primary: '#334155', secondary: '#1e293b', light: '#f8fafc', border: '#cbd5e1' },
  violet: { primary: '#7c3aed', secondary: '#6d28d9', light: '#f5f3ff', border: '#ddd6fe' },
};

export const FONT_FAMILIES: Record<FontFamilyId, string> = {
  sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
};

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  (
    {
      data,
      template = 'executive',
      accentColor = 'indigo',
      fontFamily = 'sans',
      density = 'standard',
      scale = 1,
      className = '',
      isPrintMode = false,
      showPageCutMarkers = true,
      highlightedSection = null,
      onPageCountChange,
    },
    ref
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const [pageCount, setPageCount] = useState<number>(1);
    const [sheetHeight, setSheetHeight] = useState<number>(A4_HEIGHT_PX);

    const activeColor = ACCENT_COLORS[accentColor] || ACCENT_COLORS.indigo;
    const activeFont = FONT_FAMILIES[fontFamily] || FONT_FAMILIES.sans;

    const { personal, summary, experience, education, projects, skills, certificates } = data;

    // Measure total document height to detect A4 page count & overflow
    useEffect(() => {
      const el = (ref && typeof ref !== 'function' ? ref.current : null) || internalRef.current;
      if (!el) return;

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const height = entry.contentRect.height;
          setSheetHeight(height);
          const computedPages = Math.max(1, Math.ceil(height / A4_HEIGHT_PX));
          setPageCount(computedPages);
          if (onPageCountChange) {
            onPageCountChange(computedPages);
          }
        }
      });

      observer.observe(el);
      return () => observer.disconnect();
    }, [data, template, accentColor, fontFamily, density, ref, onPageCountChange]);

    // Format clean external URLs
    const formatUrl = (url: string) => {
      if (!url) return '';
      return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    };

    // Helper to render bullet points
    const renderBullets = (text: string) => {
      if (!text) return null;
      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length === 0) return null;

      return (
        <ul className="list-outside pl-4 space-y-1 mt-1 text-slate-700" style={{ listStyleType: 'disc' }}>
          {lines.map((line, idx) => (
            <li key={idx} className="break-words pl-0.5 leading-relaxed">
              {line.replace(/^[•\s\-\*]+/, '')}
            </li>
          ))}
        </ul>
      );
    };

    // Margin & font size presets based on density mode
    const densityConfig = {
      compact: {
        padding: '24px 30px',
        baseFontSize: '10px',
        lineHeight: 1.35,
        headerMargin: 'mb-2.5',
        sectionMargin: 'mb-2.5',
        itemSpacing: 'space-y-1.5',
      },
      standard: {
        padding: '36px 42px',
        baseFontSize: '11px',
        lineHeight: 1.45,
        headerMargin: 'mb-3.5',
        sectionMargin: 'mb-3.5',
        itemSpacing: 'space-y-2.5',
      },
      spacious: {
        padding: '44px 50px',
        baseFontSize: '12px',
        lineHeight: 1.55,
        headerMargin: 'mb-4.5',
        sectionMargin: 'mb-4.5',
        itemSpacing: 'space-y-3.5',
      },
    }[density];

    // Combine refs
    const setRefs = (node: HTMLDivElement | null) => {
      (internalRef as any).current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as any).current = node;
      }
    };

    // Highlight helper class
    const sectionHighlight = (secName: string) =>
      highlightedSection === secName
        ? 'ring-2 ring-indigo-400 bg-indigo-50/20 rounded p-1 -m-1 transition-all'
        : 'transition-all';

    /* ─────────────────────────────────────────────────────────────
       TEMPLATE 1: EXECUTIVE (Modern Top Accent & Clean Rules)
       ───────────────────────────────────────────────────────────── */
    const renderExecutiveTemplate = () => (
      <div className="space-y-0">
        {/* Header with colored top bar */}
        <header
          className={`pb-3 ${densityConfig.headerMargin} border-b-2 ${sectionHighlight('personal')}`}
          style={{ borderColor: activeColor.primary }}
        >
          <div className="flex flex-col items-start justify-between sm:flex-row sm:items-baseline gap-2">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                {personal.fullName || 'YOUR FULL NAME'}
              </h1>
              {personal.headline && (
                <p
                  className="text-xs font-bold uppercase tracking-wider mt-0.5"
                  style={{ color: activeColor.primary }}
                >
                  {personal.headline}
                </p>
              )}
            </div>

            {/* Quick Location Badge */}
            {personal.location && (
              <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 shrink-0">
                <MapPin className="h-3 w-3" style={{ color: activeColor.primary }} />
                {personal.location}
              </span>
            )}
          </div>

          {/* Contact Bar */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10.5px] text-slate-600 font-medium">
            {personal.email && (
              <a href={`mailto:${personal.email}`} className="inline-flex items-center gap-1 hover:underline text-slate-800">
                <Mail className="h-3 w-3 text-slate-400 print:hidden" />
                <span>{personal.email}</span>
              </a>
            )}
            {personal.phone && (
              <span className="inline-flex items-center gap-1">
                <span className="text-slate-300">|</span>
                <Phone className="h-3 w-3 text-slate-400 print:hidden" />
                <span>{personal.phone}</span>
              </span>
            )}
            {personal.linkedinUrl && (
              <a
                href={personal.linkedinUrl.startsWith('http') ? personal.linkedinUrl : `https://${personal.linkedinUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:underline text-slate-800"
              >
                <span className="text-slate-300">|</span>
                <Linkedin className="h-3 w-3 print:hidden" style={{ color: activeColor.primary }} />
                <span>{formatUrl(personal.linkedinUrl)}</span>
              </a>
            )}
            {personal.githubUrl && (
              <a
                href={personal.githubUrl.startsWith('http') ? personal.githubUrl : `https://${personal.githubUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:underline text-slate-800"
              >
                <span className="text-slate-300">|</span>
                <Github className="h-3 w-3 text-slate-700 print:hidden" />
                <span>{formatUrl(personal.githubUrl)}</span>
              </a>
            )}
            {personal.portfolioUrl && (
              <a
                href={personal.portfolioUrl.startsWith('http') ? personal.portfolioUrl : `https://${personal.portfolioUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:underline text-slate-800"
              >
                <span className="text-slate-300">|</span>
                <Globe className="h-3 w-3 print:hidden" style={{ color: activeColor.primary }} />
                <span>{formatUrl(personal.portfolioUrl)}</span>
              </a>
            )}
          </div>
        </header>

        {/* Summary */}
        {summary && (
          <section className={`${densityConfig.sectionMargin} break-inside-avoid ${sectionHighlight('summary')}`}>
            <h2
              className="text-[11px] font-black uppercase tracking-wider pb-0.5 mb-1 flex items-center gap-1.5 border-b"
              style={{ color: activeColor.primary, borderColor: activeColor.border }}
            >
              Professional Summary
            </h2>
            <p className="leading-relaxed text-slate-800 text-justify">{summary}</p>
          </section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <section className={`${densityConfig.sectionMargin} ${sectionHighlight('experience')}`}>
            <h2
              className="text-[11px] font-black uppercase tracking-wider pb-0.5 mb-1.5 flex items-center gap-1.5 border-b break-inside-avoid"
              style={{ color: activeColor.primary, borderColor: activeColor.border }}
            >
              Work Experience
            </h2>
            <div className={densityConfig.itemSpacing}>
              {experience.map((exp) => (
                <div key={exp.id} className="break-inside-avoid space-y-0.5">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-bold text-slate-950 text-[11.5px]">{exp.title}</span>
                    <span className="text-[10.5px] font-bold shrink-0" style={{ color: activeColor.secondary }}>
                      {exp.startDate} {exp.startDate && exp.endDate ? '–' : ''} {exp.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-[10.5px] text-slate-600 font-medium">
                    <span className="font-semibold text-slate-800">{exp.company}</span>
                    {exp.location && <span className="italic">{exp.location}</span>}
                  </div>
                  {renderBullets(exp.description)}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section className={`${densityConfig.sectionMargin} ${sectionHighlight('education')}`}>
            <h2
              className="text-[11px] font-black uppercase tracking-wider pb-0.5 mb-1.5 flex items-center gap-1.5 border-b break-inside-avoid"
              style={{ color: activeColor.primary, borderColor: activeColor.border }}
            >
              Education
            </h2>
            <div className="space-y-2">
              {education.map((edu) => (
                <div key={edu.id} className="break-inside-avoid flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-950 text-[11.5px]">{edu.institution}</h3>
                    <p className="text-slate-700">{edu.degree}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10.5px] font-bold block" style={{ color: activeColor.secondary }}>
                      {edu.startYear} {edu.startYear && edu.endYear ? '–' : ''} {edu.endYear}
                    </span>
                    {edu.cgpa && (
                      <span className="text-[10px] font-bold text-slate-600 block">
                        CGPA: {edu.cgpa}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className={`${densityConfig.sectionMargin} ${sectionHighlight('projects')}`}>
            <h2
              className="text-[11px] font-black uppercase tracking-wider pb-0.5 mb-1.5 flex items-center gap-1.5 border-b break-inside-avoid"
              style={{ color: activeColor.primary, borderColor: activeColor.border }}
            >
              Key Projects
            </h2>
            <div className={densityConfig.itemSpacing}>
              {projects.map((proj) => (
                <div key={proj.id} className="break-inside-avoid space-y-0.5">
                  <div className="flex justify-between items-baseline gap-2">
                    <h3 className="font-bold text-slate-950 text-[11.5px]">{proj.title}</h3>
                    {proj.demoLink && (
                      <a
                        href={proj.demoLink.startsWith('http') ? proj.demoLink : `https://${proj.demoLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-mono hover:underline shrink-0 flex items-center gap-1"
                        style={{ color: activeColor.primary }}
                      >
                        {formatUrl(proj.demoLink)}
                        <ExternalLink className="h-2.5 w-2.5 print:hidden" />
                      </a>
                    )}
                  </div>
                  {proj.technologies && (
                    <p className="text-[10px] font-semibold" style={{ color: activeColor.secondary }}>
                      {proj.technologies}
                    </p>
                  )}
                  {renderBullets(proj.description)}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {(skills.programming.length > 0 || skills.web.length > 0 || skills.tools.length > 0) && (
          <section className={`${densityConfig.sectionMargin} break-inside-avoid ${sectionHighlight('skills')}`}>
            <h2
              className="text-[11px] font-black uppercase tracking-wider pb-0.5 mb-1 flex items-center gap-1.5 border-b"
              style={{ color: activeColor.primary, borderColor: activeColor.border }}
            >
              Technical Competencies
            </h2>
            <div className="space-y-0.5 leading-relaxed text-slate-800">
              {skills.programming.filter(Boolean).length > 0 && (
                <p>
                  <span className="font-bold text-slate-900">Languages:</span>{' '}
                  {skills.programming.filter(Boolean).join(', ')}
                </p>
              )}
              {skills.web.filter(Boolean).length > 0 && (
                <p>
                  <span className="font-bold text-slate-900">Web & Frameworks:</span>{' '}
                  {skills.web.filter(Boolean).join(', ')}
                </p>
              )}
              {skills.tools.filter(Boolean).length > 0 && (
                <p>
                  <span className="font-bold text-slate-900">Cloud & Tools:</span>{' '}
                  {skills.tools.filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Certifications */}
        {certificates.length > 0 && (
          <section className={`break-inside-avoid ${sectionHighlight('certificates')}`}>
            <h2
              className="text-[11px] font-black uppercase tracking-wider pb-0.5 mb-1 flex items-center gap-1.5 border-b"
              style={{ color: activeColor.primary, borderColor: activeColor.border }}
            >
              Certifications & Honors
            </h2>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700">
              {certificates.map((cert) => (
                <li key={cert.id}>
                  <span className="font-semibold text-slate-900">{cert.title}</span>
                  {cert.issuer && ` – ${cert.issuer}`}
                  {cert.date && ` (${cert.date})`}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );

    /* ─────────────────────────────────────────────────────────────
       TEMPLATE 2: STANFORD CLASSIC (Centered, Serif, Double Rules)
       ───────────────────────────────────────────────────────────── */
    const renderClassicTemplate = () => (
      <div className="space-y-0">
        {/* Centered Traditional Header */}
        <header className={`text-center pb-2.5 ${densityConfig.headerMargin} border-b-[1.5px] border-slate-900 ${sectionHighlight('personal')}`}>
          <h1 className="text-2xl font-black uppercase tracking-wider text-slate-950 font-serif">
            {personal.fullName || 'YOUR FULL NAME'}
          </h1>
          {personal.headline && (
            <p className="text-[11.5px] font-medium italic text-slate-700 mt-0.5">
              {personal.headline}
            </p>
          )}

          {/* Centered Contact Line */}
          <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-0.5 mt-1.5 text-[10.5px] text-slate-700">
            {personal.email && (
              <a href={`mailto:${personal.email}`} className="hover:underline">
                {personal.email}
              </a>
            )}
            {personal.phone && (
              <>
                <span className="text-slate-400">♦</span>
                <span>{personal.phone}</span>
              </>
            )}
            {personal.location && (
              <>
                <span className="text-slate-400">♦</span>
                <span>{personal.location}</span>
              </>
            )}
            {personal.linkedinUrl && (
              <>
                <span className="text-slate-400">♦</span>
                <a
                  href={personal.linkedinUrl.startsWith('http') ? personal.linkedinUrl : `https://${personal.linkedinUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  {formatUrl(personal.linkedinUrl)}
                </a>
              </>
            )}
            {personal.githubUrl && (
              <>
                <span className="text-slate-400">♦</span>
                <a
                  href={personal.githubUrl.startsWith('http') ? personal.githubUrl : `https://${personal.githubUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  {formatUrl(personal.githubUrl)}
                </a>
              </>
            )}
          </div>
        </header>

        {/* Summary */}
        {summary && (
          <section className={`${densityConfig.sectionMargin} break-inside-avoid ${sectionHighlight('summary')}`}>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-950 border-b border-slate-400 pb-0.5 mb-1">
              Objective & Profile
            </h2>
            <p className="text-slate-800 leading-relaxed text-justify">{summary}</p>
          </section>
        )}

        {/* Education First (Traditional Academic/Placement Standard) */}
        {education.length > 0 && (
          <section className={`${densityConfig.sectionMargin} ${sectionHighlight('education')}`}>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-950 border-b border-slate-400 pb-0.5 mb-1.5 break-inside-avoid">
              Education
            </h2>
            <div className="space-y-1.5">
              {education.map((edu) => (
                <div key={edu.id} className="break-inside-avoid flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-950 text-[11.5px]">{edu.institution}</h3>
                    <p className="text-slate-800 italic">{edu.degree}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900 block text-[10.5px]">
                      {edu.startYear} {edu.startYear && edu.endYear ? '–' : ''} {edu.endYear}
                    </span>
                    {edu.cgpa && <span className="text-[10px] text-slate-700 font-medium">CGPA: {edu.cgpa}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <section className={`${densityConfig.sectionMargin} ${sectionHighlight('experience')}`}>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-950 border-b border-slate-400 pb-0.5 mb-1.5 break-inside-avoid">
              Experience
            </h2>
            <div className={densityConfig.itemSpacing}>
              {experience.map((exp) => (
                <div key={exp.id} className="break-inside-avoid space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-slate-950 text-[11.5px]">{exp.company}</h3>
                    <span className="font-semibold text-slate-800 text-[10.5px]">
                      {exp.startDate} {exp.startDate && exp.endDate ? '–' : ''} {exp.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-[10.5px] italic text-slate-700">
                    <span>{exp.title}</span>
                    {exp.location && <span>{exp.location}</span>}
                  </div>
                  {renderBullets(exp.description)}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className={`${densityConfig.sectionMargin} ${sectionHighlight('projects')}`}>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-950 border-b border-slate-400 pb-0.5 mb-1.5 break-inside-avoid">
              Selected Projects
            </h2>
            <div className={densityConfig.itemSpacing}>
              {projects.map((proj) => (
                <div key={proj.id} className="break-inside-avoid space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-slate-950 text-[11.5px]">{proj.title}</h3>
                    {proj.demoLink && (
                      <span className="text-[10px] font-mono text-slate-600">{formatUrl(proj.demoLink)}</span>
                    )}
                  </div>
                  {proj.technologies && (
                    <p className="text-[10px] italic text-slate-700">{proj.technologies}</p>
                  )}
                  {renderBullets(proj.description)}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {(skills.programming.length > 0 || skills.web.length > 0 || skills.tools.length > 0) && (
          <section className={`${densityConfig.sectionMargin} break-inside-avoid ${sectionHighlight('skills')}`}>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-950 border-b border-slate-400 pb-0.5 mb-1">
              Skills & Qualifications
            </h2>
            <div className="space-y-0.5 text-slate-800">
              {skills.programming.filter(Boolean).length > 0 && (
                <p>
                  <span className="font-bold">Programming Languages:</span>{' '}
                  {skills.programming.filter(Boolean).join(', ')}
                </p>
              )}
              {skills.web.filter(Boolean).length > 0 && (
                <p>
                  <span className="font-bold">Frameworks & Tools:</span>{' '}
                  {skills.web.filter(Boolean).join(', ')}
                </p>
              )}
              {skills.tools.filter(Boolean).length > 0 && (
                <p>
                  <span className="font-bold">Systems & Environments:</span>{' '}
                  {skills.tools.filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Certifications */}
        {certificates.length > 0 && (
          <section className={`break-inside-avoid ${sectionHighlight('certificates')}`}>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-950 border-b border-slate-400 pb-0.5 mb-1">
              Honors & Certifications
            </h2>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700">
              {certificates.map((cert) => (
                <li key={cert.id}>
                  <span className="font-semibold text-slate-900">{cert.title}</span>
                  {cert.issuer && ` — ${cert.issuer}`}
                  {cert.date && ` (${cert.date})`}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );

    /* ─────────────────────────────────────────────────────────────
       TEMPLATE 3: TECH SPECIALIST (Asymmetric 2-Column Layout)
       ───────────────────────────────────────────────────────────── */
    const renderTechTwoColumnTemplate = () => (
      <div>
        {/* Top Header Banner */}
        <header className={`pb-3 ${densityConfig.headerMargin} border-b-2 ${sectionHighlight('personal')}`} style={{ borderColor: activeColor.primary }}>
          <div className="flex justify-between items-baseline">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                {personal.fullName || 'YOUR FULL NAME'}
              </h1>
              {personal.headline && (
                <p className="text-xs font-mono font-bold tracking-wide mt-0.5" style={{ color: activeColor.primary }}>
                  &gt; {personal.headline}
                </p>
              )}
            </div>
            {personal.location && (
              <span className="text-[10px] font-medium text-slate-500">{personal.location}</span>
            )}
          </div>
        </header>

        {/* Asymmetrical 2-Column Split: Left Rail (33%) / Right Body (67%) */}
        <div className="grid grid-cols-12 gap-5">
          {/* ── LEFT SIDEBAR (Col 1-4: 33%) ──────────────────── */}
          <div className="col-span-4 space-y-4 border-r border-slate-200 pr-4">
            {/* Contact Details */}
            <div className={`space-y-1.5 break-inside-avoid ${sectionHighlight('personal')}`}>
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                // CONTACT
              </h3>
              <div className="space-y-1 text-[10px] text-slate-700">
                {personal.email && (
                  <a href={`mailto:${personal.email}`} className="block truncate hover:underline text-slate-900 font-medium">
                    {personal.email}
                  </a>
                )}
                {personal.phone && <p className="font-mono text-slate-800">{personal.phone}</p>}
                {personal.githubUrl && (
                  <a
                    href={personal.githubUrl.startsWith('http') ? personal.githubUrl : `https://${personal.githubUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate hover:underline font-mono"
                    style={{ color: activeColor.primary }}
                  >
                    gh/{formatUrl(personal.githubUrl)}
                  </a>
                )}
                {personal.linkedinUrl && (
                  <a
                    href={personal.linkedinUrl.startsWith('http') ? personal.linkedinUrl : `https://${personal.linkedinUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate hover:underline"
                    style={{ color: activeColor.primary }}
                  >
                    in/{formatUrl(personal.linkedinUrl)}
                  </a>
                )}
                {personal.portfolioUrl && (
                  <a
                    href={personal.portfolioUrl.startsWith('http') ? personal.portfolioUrl : `https://${personal.portfolioUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate hover:underline font-mono"
                    style={{ color: activeColor.primary }}
                  >
                    {formatUrl(personal.portfolioUrl)}
                  </a>
                )}
              </div>
            </div>

            {/* Technical Skills Badges */}
            {(skills.programming.length > 0 || skills.web.length > 0 || skills.tools.length > 0) && (
              <div className={`space-y-2 break-inside-avoid ${sectionHighlight('skills')}`}>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                  // SKILLS STACK
                </h3>
                {skills.programming.filter(Boolean).length > 0 && (
                  <div>
                    <span className="text-[9.5px] font-bold text-slate-500 uppercase block mb-1">Languages</span>
                    <div className="flex flex-wrap gap-1">
                      {skills.programming.filter(Boolean).map((s, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-semibold"
                          style={{ backgroundColor: activeColor.light, color: activeColor.secondary }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {skills.web.filter(Boolean).length > 0 && (
                  <div>
                    <span className="text-[9.5px] font-bold text-slate-500 uppercase block mb-1">Web & Backend</span>
                    <div className="flex flex-wrap gap-1">
                      {skills.web.filter(Boolean).map((s, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-semibold bg-slate-100 text-slate-800"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {skills.tools.filter(Boolean).length > 0 && (
                  <div>
                    <span className="text-[9.5px] font-bold text-slate-500 uppercase block mb-1">Tools & Cloud</span>
                    <div className="flex flex-wrap gap-1">
                      {skills.tools.filter(Boolean).map((s, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-semibold bg-slate-100 text-slate-700"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Education in Rail */}
            {education.length > 0 && (
              <div className={`space-y-1.5 break-inside-avoid ${sectionHighlight('education')}`}>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                  // EDUCATION
                </h3>
                {education.map((edu) => (
                  <div key={edu.id} className="space-y-0.5 text-[10px]">
                    <h4 className="font-bold text-slate-900 leading-snug">{edu.institution}</h4>
                    <p className="text-slate-700">{edu.degree}</p>
                    <p className="font-mono text-slate-500 text-[9.5px]">
                      {edu.startYear} – {edu.endYear}
                    </p>
                    {edu.cgpa && (
                      <span className="inline-block font-bold text-[9.5px]" style={{ color: activeColor.primary }}>
                        CGPA: {edu.cgpa}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Certifications in Rail */}
            {certificates.length > 0 && (
              <div className={`space-y-1.5 break-inside-avoid ${sectionHighlight('certificates')}`}>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                  // CERTIFICATIONS
                </h3>
                <ul className="space-y-1 text-[10px]">
                  {certificates.map((c) => (
                    <li key={c.id} className="leading-snug">
                      <span className="font-semibold text-slate-900 block">{c.title}</span>
                      <span className="text-slate-500 text-[9px] font-mono">{c.issuer}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── RIGHT MAIN PANEL (Col 5-12: 67%) ─────────────── */}
          <div className="col-span-8 space-y-4">
            {/* Summary */}
            {summary && (
              <div className={`break-inside-avoid ${sectionHighlight('summary')}`}>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono mb-1">
                  // SUMMARY
                </h3>
                <p className="text-slate-800 leading-relaxed text-justify">{summary}</p>
              </div>
            )}

            {/* Work Experience */}
            {experience.length > 0 && (
              <div className={sectionHighlight('experience')}>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono mb-2 break-inside-avoid">
                  // EXPERIENCE
                </h3>
                <div className={densityConfig.itemSpacing}>
                  {experience.map((exp) => (
                    <div key={exp.id} className="break-inside-avoid space-y-0.5">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="font-bold text-slate-950 text-[11.5px]">{exp.title}</span>
                        <span className="text-[10px] font-mono font-semibold" style={{ color: activeColor.primary }}>
                          {exp.startDate} – {exp.endDate}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline text-[10.5px] text-slate-600">
                        <span className="font-medium text-slate-800">{exp.company}</span>
                        {exp.location && <span className="text-[10px]">{exp.location}</span>}
                      </div>
                      {renderBullets(exp.description)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Projects */}
            {projects.length > 0 && (
              <div className={sectionHighlight('projects')}>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono mb-2 break-inside-avoid">
                  // FEATURED PROJECTS
                </h3>
                <div className={densityConfig.itemSpacing}>
                  {projects.map((proj) => (
                    <div key={proj.id} className="break-inside-avoid space-y-0.5">
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className="font-bold text-slate-950 text-[11.5px]">{proj.title}</h4>
                        {proj.demoLink && (
                          <a
                            href={proj.demoLink.startsWith('http') ? proj.demoLink : `https://${proj.demoLink}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[9.5px] font-mono hover:underline"
                            style={{ color: activeColor.primary }}
                          >
                            {formatUrl(proj.demoLink)}
                          </a>
                        )}
                      </div>
                      {proj.technologies && (
                        <p className="text-[10px] font-mono font-semibold text-slate-600">
                          [{proj.technologies}]
                        </p>
                      )}
                      {renderBullets(proj.description)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );

    /* ─────────────────────────────────────────────────────────────
       TEMPLATE 4: MINIMALIST (Clean ATS Mono / Sans)
       ───────────────────────────────────────────────────────────── */
    const renderMinimalTemplate = () => (
      <div className="space-y-0">
        <header className={`pb-2 ${densityConfig.headerMargin} border-b border-slate-300 ${sectionHighlight('personal')}`}>
          <h1 className="text-xl font-bold tracking-tight text-slate-950">
            {personal.fullName || 'YOUR FULL NAME'}
          </h1>
          {personal.headline && (
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">{personal.headline}</p>
          )}
          <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 mt-1 text-[10.5px] text-slate-600">
            {personal.email && <span>{personal.email}</span>}
            {personal.phone && <span>· {personal.phone}</span>}
            {personal.location && <span>· {personal.location}</span>}
            {personal.linkedinUrl && <span>· {formatUrl(personal.linkedinUrl)}</span>}
            {personal.githubUrl && <span>· {formatUrl(personal.githubUrl)}</span>}
          </div>
        </header>

        {summary && (
          <section className={`${densityConfig.sectionMargin} break-inside-avoid ${sectionHighlight('summary')}`}>
            <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-900 mb-0.5">
              Summary
            </h2>
            <p className="leading-relaxed text-slate-800">{summary}</p>
          </section>
        )}

        {experience.length > 0 && (
          <section className={`${densityConfig.sectionMargin} ${sectionHighlight('experience')}`}>
            <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-900 mb-1 break-inside-avoid">
              Experience
            </h2>
            <div className={densityConfig.itemSpacing}>
              {experience.map((exp) => (
                <div key={exp.id} className="break-inside-avoid space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900">{exp.title} – {exp.company}</span>
                    <span className="text-[10px] text-slate-600">{exp.startDate} – {exp.endDate}</span>
                  </div>
                  {renderBullets(exp.description)}
                </div>
              ))}
            </div>
          </section>
        )}

        {education.length > 0 && (
          <section className={`${densityConfig.sectionMargin} ${sectionHighlight('education')}`}>
            <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-900 mb-1 break-inside-avoid">
              Education
            </h2>
            <div className="space-y-1">
              {education.map((edu) => (
                <div key={edu.id} className="break-inside-avoid flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-slate-900">{edu.degree}</span>, {edu.institution}
                  </div>
                  <span className="text-[10px] text-slate-600">
                    {edu.startYear} – {edu.endYear} {edu.cgpa ? `(CGPA: ${edu.cgpa})` : ''}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {projects.length > 0 && (
          <section className={`${densityConfig.sectionMargin} ${sectionHighlight('projects')}`}>
            <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-900 mb-1 break-inside-avoid">
              Projects
            </h2>
            <div className={densityConfig.itemSpacing}>
              {projects.map((proj) => (
                <div key={proj.id} className="break-inside-avoid space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900">{proj.title}</span>
                    {proj.demoLink && (
                      <span className="text-[9.5px] text-slate-500 font-mono">{formatUrl(proj.demoLink)}</span>
                    )}
                  </div>
                  {proj.technologies && (
                    <p className="text-[9.5px] text-slate-600">Built with: {proj.technologies}</p>
                  )}
                  {renderBullets(proj.description)}
                </div>
              ))}
            </div>
          </section>
        )}

        {(skills.programming.length > 0 || skills.web.length > 0 || skills.tools.length > 0) && (
          <section className={`${densityConfig.sectionMargin} break-inside-avoid ${sectionHighlight('skills')}`}>
            <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-900 mb-0.5">
              Skills
            </h2>
            <p className="text-slate-800 leading-relaxed">
              {[
                skills.programming.filter(Boolean).join(', '),
                skills.web.filter(Boolean).join(', '),
                skills.tools.filter(Boolean).join(', '),
              ]
                .filter(Boolean)
                .join(' • ')}
            </p>
          </section>
        )}

        {certificates.length > 0 && (
          <section className={`break-inside-avoid ${sectionHighlight('certificates')}`}>
            <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-900 mb-0.5">
              Certificates
            </h2>
            <p className="text-slate-800 text-[10px]">
              {certificates.map((c) => `${c.title} (${c.issuer || ''})`).join(' • ')}
            </p>
          </section>
        )}
      </div>
    );

    // Calculate number of page cut markers
    const cutMarkers = [];
    if (showPageCutMarkers && !isPrintMode && sheetHeight > A4_HEIGHT_PX) {
      const extraPages = Math.floor(sheetHeight / A4_HEIGHT_PX);
      for (let i = 1; i <= extraPages; i++) {
        cutMarkers.push(i * A4_HEIGHT_PX);
      }
    }

    return (
      <div className="relative inline-block select-text">
        <div
          ref={setRefs}
          id="resume-a4-document"
          style={{
            width: `${A4_WIDTH_PX}px`,
            minHeight: `${A4_HEIGHT_PX}px`,
            transform: isPrintMode ? 'none' : `scale(${scale})`,
            transformOrigin: 'top center',
            padding: densityConfig.padding,
            fontFamily: activeFont,
            fontSize: densityConfig.baseFontSize,
            lineHeight: densityConfig.lineHeight,
            color: '#0f172a',
            backgroundColor: '#ffffff',
            boxSizing: 'border-box',
          }}
          className={`resume-sheet relative shadow-[0_20px_50px_rgba(0,0,0,0.18)] ring-1 ring-slate-900/10 transition-shadow ${className}`}
        >
          {/* Visual Page Break Marker lines if content spills beyond 1 A4 page */}
          {cutMarkers.map((cutTop, idx) => (
            <div
              key={idx}
              className="absolute left-0 right-0 pointer-events-none z-20 print:hidden flex items-center justify-between"
              style={{ top: `${cutTop}px`, transform: 'translateY(-50%)' }}
            >
              <div className="w-full border-b-2 border-dashed border-rose-500/80" />
              <span className="absolute right-4 px-2 py-0.5 rounded text-[9px] font-bold bg-rose-600 text-white shadow-md flex items-center gap-1 shrink-0">
                <Scissors className="h-2.5 w-2.5" />
                Page {idx + 1} End · Page {idx + 2} Starts
              </span>
            </div>
          ))}

          {/* Template Selection Render */}
          {template === 'executive' && renderExecutiveTemplate()}
          {template === 'classic' && renderClassicTemplate()}
          {template === 'tech_two_column' && renderTechTwoColumnTemplate()}
          {template === 'minimal' && renderMinimalTemplate()}
        </div>
      </div>
    );
  }
);

ResumePreview.displayName = 'ResumePreview';
