import React, { useState } from 'react';
import { StudentProfile } from '../types';
import { studentService } from '../services/studentService';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import { CheckCircle2, User, Globe, Code2, FolderGit2, ArrowRight, ArrowLeft, Check } from 'lucide-react';

interface ProfileCompletionWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile | null;
  onProfileUpdated: () => void;
}

export const ProfileCompletionWizardModal: React.FC<ProfileCompletionWizardModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}) => {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    bio: profile?.bio || '',
    github_url: profile?.github_url || '',
    linkedin_url: profile?.linkedin_url || '',
    portfolio_url: profile?.portfolio_url || '',
    newSkill: '',
    projectTitle: '',
    projectDesc: '',
    projectTech: '',
  });

  const handleSaveStep = async (nextStep?: number) => {
    setSaving(true);
    try {
      await studentService.updateProfile({
        bio: formData.bio,
        github_url: formData.github_url,
        linkedin_url: formData.linkedin_url,
        portfolio_url: formData.portfolio_url,
      });

      if (nextStep) {
        setStep(nextStep);
      } else {
        confetti({ particleCount: 80, spread: 70 });
        toast.success('Profile Strength Boosted! 🚀', 'Your profile is now 100% completed.');
        onProfileUpdated();
        onClose();
      }
    } catch {
      toast.error('Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { num: 1, title: 'Bio & Overview', icon: User },
    { num: 2, title: 'Social Profiles', icon: Globe },
    { num: 3, title: 'Technical Skills', icon: Code2 },
    { num: 4, title: 'Featured Project', icon: FolderGit2 },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Automated Profile Completion Wizard"
      size="xl"
    >
      <div className="space-y-5">
        {/* Step Progress Bar */}
        <div className="grid grid-cols-4 gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
          {steps.map((s) => {
            const Icon = s.icon;
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div
                key={s.num}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-center transition-all ${
                  isCurrent
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                    : isCompleted
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-midnight-850'
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span className="text-[10px] hidden sm:inline">{s.title}</span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        {step === 1 && (
          <div className="space-y-3.5">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Step 1: Bio & Summary (+20% Strength)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Provide a short technical elevator pitch highlighting your engineering interests.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Professional Bio / Summary
              </label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="e.g. Junior CSE undergraduate focused on high-throughput distributed systems..."
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3.5">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Step 2: Social Links & Portfolio (+15% Strength)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect your GitHub, LinkedIn, and personal portfolio for recruiter discovery.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  GitHub Profile URL
                </label>
                <input
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  placeholder="https://github.com/username"
                  className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-950 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3.5">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Step 3: Core Technical Competencies (+15% Strength)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Confirm your core programming languages, frameworks, and tools.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-midnight-900 border border-slate-200 dark:border-white/5">
              {['React & TypeScript', 'PostgreSQL', 'Python & PyTorch', 'Docker & Kubernetes', 'Distributed Systems'].map((tech) => (
                <Badge key={tech} variant="primary" size="sm">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3.5">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Step 4: Showcase Project (+10% Strength)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Highlight your capstone project or open-source software contribution.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-midnight-900 border border-slate-200 dark:border-white/5 space-y-2">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Real-Time Distributed Collaborative Whiteboard
              </p>
              <p className="text-[11px] text-slate-500">
                CRDT-based canvas with WebSockets & React. Faculty Mentor: Dr. Rajesh Sharma.
              </p>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
          {step > 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(step - 1)}
              leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
            >
              Back
            </Button>
          ) : <div />}

          {step < 4 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSaveStep(step + 1)}
              isLoading={saving}
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Save & Next Step
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSaveStep()}
              isLoading={saving}
              leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
            >
              Complete Wizard (100%)
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
