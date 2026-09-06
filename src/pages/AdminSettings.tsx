import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { SiteSettings } from '../types';
import { useBranding, DEFAULT_BRANDING, BrandingSettings } from '../context/BrandingContext';
import { PageHeader } from '../components/PageHeader';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Input, Textarea } from '../components/Input';
import { useToast } from '../context/ToastContext';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Badge } from '../components/Badge';
import confetti from 'canvas-confetti';
import {
  Save,
  Plus,
  Trash2,
  Globe,
  Sparkles,
  Layers,
  CheckCircle2,
  RotateCcw,
  Building,
  GraduationCap,
  Calendar,
  AlertTriangle,
  Sliders,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  Percent,
  Check,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { branding, updateBranding, resetToDefaults, renderBrandName } = useBranding();
  const toast = useToast();

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Local Brand form state (for 1-click apply)
  const [brandForm, setBrandForm] = useState<BrandingSettings>({ ...branding });

  // Sync brandForm if branding updates externally
  useEffect(() => {
    setBrandForm({ ...branding });
  }, [branding]);

  useEffect(() => {
    adminService
      .getSiteSettings()
      .then((res) => {
        if (res) {
          setSettings({
            ...res,
            faqs: (res.faqs || []).filter((f: any) => f.question !== '__BRANDING__'),
          });
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load system settings', err?.message);
      })
      .finally(() => setLoading(false));
  }, []);

  // 1-Click Software Renaming & Global Branding Action
  const handleSaveBranding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingIdentity(true);
    try {
      await updateBranding(brandForm);
      confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
      toast.success(
        'Software Name & Branding Updated! 🎉',
        `The platform is now globally branded as "${brandForm.appName}". Changes applied everywhere in 1-click.`
      );
    } catch (err: any) {
      toast.error('Branding Update Failed', err?.message);
    } finally {
      setSavingIdentity(false);
    }
  };

  const handleResetBranding = async () => {
    if (window.confirm('Reset software name and branding back to default CampusSphere?')) {
      setSavingIdentity(true);
      try {
        await resetToDefaults();
        setBrandForm(DEFAULT_BRANDING);
        toast.info('Branding Reset', 'Platform branding restored to CampusSphere defaults.');
      } catch (err: any) {
        toast.error('Reset Failed', err?.message);
      } finally {
        setSavingIdentity(false);
      }
    }
  };

  // Save Academic, Operations & CMS settings
  const handleSaveSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    try {
      await adminService.updateSiteSettings(settings);
      toast.success('System Settings Saved', 'Academic term, maintenance mode, and CMS details have been updated.');
    } catch (err: any) {
      toast.error('Save Failed', err?.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // FAQ Manager
  const handleAddFaq = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      faqs: [...(settings.faqs || []), { question: 'New Question', answer: 'Answer details...' }],
    });
  };

  const handleRemoveFaq = (idx: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      faqs: settings.faqs.filter((_, i) => i !== idx),
    });
  };

  const handleUpdateFaq = (idx: number, field: 'question' | 'answer', val: string) => {
    if (!settings) return;
    const newFaqs = [...settings.faqs];
    newFaqs[idx] = { ...newFaqs[idx], [field]: val };
    setSettings({ ...settings, faqs: newFaqs });
  };

  if (loading) return <LoadingSkeleton rows={8} />;
  if (!settings) return null;

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto animate-fade-in text-slate-900 dark:text-slate-100">
      {/* Header */}
      <PageHeader
        title="Institutional Configuration & Branding"
        subtitle="Customize software name in 1-click, configure academic terms, maintenance status, and landing page details"
        badge={
          <Badge variant="gradient" size="sm" dot>
            Enterprise OS
          </Badge>
        }
      />

      {/* 1. SINGLE-CLICK SOFTWARE RENAMING & BRANDING ENGINE */}
      <Card className="p-6 sm:p-8 space-y-6 border-indigo-200/80 dark:border-indigo-900/40 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Sparkles className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                1-Click Software Name & Institutional Brand
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Change the name of the entire software across navigation bars, page titles, dashboards, and student portals in a single click without rebuilding.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetBranding}
              disabled={savingIdentity}
              leftIcon={<RotateCcw className="h-4 w-4" />}
              className="text-xs font-bold"
            >
              Reset Defaults
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleSaveBranding()}
              isLoading={savingIdentity}
              leftIcon={<Check className="h-4 w-4" />}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/30 text-xs font-bold"
            >
              Save & Apply Globally
            </Button>
          </div>
        </div>

        {/* Live Interactive Branding Preview Bar */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10 border border-blue-500/20 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
            <span>Live Navbar Brand Preview</span>
            <span className="text-[10px] lowercase font-mono">browser tab: {brandForm.appName} - University OS</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-midnight-900 border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                {brandForm.appName ? (
                  brandForm.appName.includes(' ') ? (
                    <>
                      {brandForm.appName.split(' ').slice(0, -1).join(' ')}{' '}
                      <span className="text-blue-600 dark:text-blue-400">
                        {brandForm.appName.split(' ').slice(-1)[0]}
                      </span>
                    </>
                  ) : (
                    <>
                      {brandForm.appName.slice(0, Math.ceil(brandForm.appName.length / 2))}
                      <span className="text-blue-600 dark:text-blue-400">
                        {brandForm.appName.slice(Math.ceil(brandForm.appName.length / 2))}
                      </span>
                    </>
                  )
                ) : (
                  'CampusSphere'
                )}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                {brandForm.tagline || 'Next-Gen University Operating System'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Inputs */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveBranding();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Software Brand Name (Global)"
              required
              value={brandForm.appName}
              onChange={(e) => setBrandForm({ ...brandForm, appName: e.target.value })}
              placeholder="e.g. Apex University OS, CampusSphere, MIT Portal"
              helperText="Appears prominently in top navigation, login screen, and page headers."
            />

            <Input
              label="Software Short Name / Acronym"
              required
              value={brandForm.shortName}
              onChange={(e) => setBrandForm({ ...brandForm, shortName: e.target.value })}
              placeholder="e.g. Apex, Campus, MIT"
              helperText="Used in compact sidebars and mobile banners."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Institution / University Name"
              value={brandForm.institutionName}
              onChange={(e) => setBrandForm({ ...brandForm, institutionName: e.target.value })}
              placeholder="e.g. State Institute of Science & Technology"
              helperText="Shown on certificates, official notices, and student transcripts."
            />

            <Input
              label="Global Tagline / Badge"
              value={brandForm.tagline}
              onChange={(e) => setBrandForm({ ...brandForm, tagline: e.target.value })}
              placeholder="e.g. Next-Gen University Operating System"
              helperText="Hero tagline displayed under brand logos and on public landing."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Institutional Support Email"
              type="email"
              value={brandForm.supportEmail}
              onChange={(e) => setBrandForm({ ...brandForm, supportEmail: e.target.value })}
              placeholder="support@university.edu"
            />

            <Input
              label="Campus Hotline / Phone"
              value={brandForm.supportPhone}
              onChange={(e) => setBrandForm({ ...brandForm, supportPhone: e.target.value })}
              placeholder="+91 1800 572 8900"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              isLoading={savingIdentity}
              leftIcon={<Save className="h-4 w-4" />}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/25"
            >
              Apply Software Name Now
            </Button>
          </div>
        </form>
      </Card>

      {/* 2. ACADEMIC CONTROLS & OPERATIONS LOCK */}
      <Card className="p-6 sm:p-8 space-y-6">
        <CardHeader
          title="Academic Calendar & Operational Settings"
          subtitle="Configure system-wide academic terms, minimum attendance rules, and emergency maintenance lock."
          icon={<Calendar className="h-5 w-5" />}
        />

        <form onSubmit={handleSaveSystemSettings} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Academic Year
              </label>
              <input
                type="text"
                value={settings.academic_year || '2025-2026'}
                onChange={(e) => setSettings({ ...settings, academic_year: e.target.value })}
                placeholder="2025-2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Active institutional cycle</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Active Semester
              </label>
              <select
                value={settings.current_semester || 1}
                onChange={(e) => setSettings({ ...settings, current_semester: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem} {sem % 2 === 1 ? '(Fall / Odd)' : '(Spring / Even)'}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">Determines course registrations</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Minimum Attendance Requirement (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={settings.attendance_threshold || 75}
                  onChange={(e) => setSettings({ ...settings, attendance_threshold: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="p-2.5 rounded-xl bg-slate-100 dark:bg-midnight-800 text-slate-500 text-xs font-bold">
                  %
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Exam hall ticket threshold</span>
            </div>
          </div>

          {/* Maintenance Mode Toggle Switch */}
          <div className="p-4 rounded-2xl border border-amber-300/60 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Platform Maintenance Mode
                </h4>
                {settings.maintenance_mode ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                    ACTIVE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    OFF
                  </span>
                )}
              </div>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                When enabled, non-administrative users will see a maintenance notice during database upgrades or term changeovers.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
            </label>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={savingSettings}
              leftIcon={<Save className="h-4 w-4" />}
              className="rounded-xl font-bold text-xs"
            >
              Save Academic Controls
            </Button>
          </div>
        </form>
      </Card>

      {/* 3. PUBLIC LANDING CMS & KEY PERFORMANCE STATISTICS */}
      <Card className="p-6 sm:p-8 space-y-6">
        <CardHeader
          title="Public Landing Page CMS & Key Metrics"
          subtitle="Directly control statistics, headline banners, and public FAQs rendered on the visitor portal."
          icon={<Globe className="h-5 w-5" />}
        />

        <form onSubmit={handleSaveSystemSettings} className="space-y-6">
          <Input
            label="Announcement Top Banner"
            value={settings.announcement_banner || ''}
            onChange={(e) => setSettings({ ...settings, announcement_banner: e.target.value })}
            placeholder="e.g. 🚀 Fall 2026 Admissions Open - Apply Before Sept 30!"
            helperText="Displays in a prominent alert banner at the very top of the public landing page."
          />

          <Input
            label="Software / Hero Headline Title"
            required
            value={settings.hero_title || ''}
            onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
            placeholder="The Intelligent Operating Platform for Modern University Campus Life"
          />

          <Textarea
            label="Hero Description & Subtitle"
            required
            rows={3}
            value={settings.hero_description || ''}
            onChange={(e) => setSettings({ ...settings, hero_description: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Primary CTA Button Text"
              value={settings.primary_cta_text || ''}
              onChange={(e) => setSettings({ ...settings, primary_cta_text: e.target.value })}
            />
            <Input
              label="Secondary CTA Button Text"
              value={settings.secondary_cta_text || ''}
              onChange={(e) => setSettings({ ...settings, secondary_cta_text: e.target.value })}
            />
          </div>

          {/* Key Statistics Displayed on Landing Page */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Institutional Statistics Counters (Public Landing)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input
                label="Enrolled Students"
                value={settings.stats_students || ''}
                onChange={(e) => setSettings({ ...settings, stats_students: e.target.value })}
                placeholder="4,200+"
              />
              <Input
                label="Attendance Rate"
                value={settings.stats_attendance || ''}
                onChange={(e) => setSettings({ ...settings, stats_attendance: e.target.value })}
                placeholder="99.4%"
              />
              <Input
                label="Placement Rate"
                value={settings.stats_placements || ''}
                onChange={(e) => setSettings({ ...settings, stats_placements: e.target.value })}
                placeholder="96%"
              />
              <Input
                label="Total Scholarships"
                value={settings.stats_scholarships || ''}
                onChange={(e) => setSettings({ ...settings, stats_scholarships: e.target.value })}
                placeholder="₹1.2 Cr+"
              />
            </div>
          </div>

          {/* FAQs Accordion Manager */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Frequently Asked Questions (FAQs)
                </h4>
                <p className="text-xs text-slate-500">
                  Public accordion items rendered on the landing page
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddFaq}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
              >
                Add Question
              </Button>
            </div>

            <div className="space-y-3">
              {(settings.faqs || [])
                .filter((f: any) => f.question !== '__BRANDING__')
                .map((faq, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-midnight-900/60 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => handleUpdateFaq(idx, 'question', e.target.value)}
                        placeholder="Question title..."
                        className="flex-1 font-bold text-xs bg-transparent border-b border-slate-200 dark:border-slate-800 pb-1 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFaq(idx)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        title="Remove question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={faq.answer}
                      onChange={(e) => handleUpdateFaq(idx, 'answer', e.target.value)}
                      placeholder="Answer details..."
                      className="w-full text-xs bg-transparent p-1 text-slate-600 dark:text-slate-300 focus:outline-none resize-none"
                    />
                  </div>
                ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
            <Button
              type="submit"
              isLoading={savingSettings}
              leftIcon={<Save className="h-4 w-4" />}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm"
            >
              Save Landing Page CMS
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
