import React, { useEffect, useState } from 'react';
import { skillService } from '../services/skillService';
import { projectService } from '../services/projectService';
import { Skill, Project, SkillCategory, SkillProficiency, ProjectStatus } from '../types';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { Tabs } from '../components/Tabs';
import { Modal } from '../components/Modal';
import { Input, Select, Textarea } from '../components/Input';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import {
  Code,
  FolderGit2,
  Plus,
  Trash2,
  ExternalLink,
  Github as GithubIcon,
  CheckCircle2,
  Award,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';

function sanitizeUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return '#';
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

const SKILL_CATEGORIES: SkillCategory[] = [
  'Programming',
  'Web Development',
  'Database',
  'Data Science',
  'Cloud',
  'Cybersecurity',
  'Communication',
  'Leadership',
  'Design',
  'Management',
];

const PROFICIENCIES: SkillProficiency[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
const PROJECT_STATUSES: ProjectStatus[] = ['Idea', 'Planning', 'Development', 'Testing', 'Completed'];

export const SkillsProjectsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('skills');
  const toast = useToast();

  // Skills State
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [skillForm, setSkillForm] = useState({
    name: '',
    category: 'Programming' as SkillCategory,
    proficiency: 'INTERMEDIATE' as SkillProficiency,
  });

  // Projects State
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    technologies: '',
    team_members: '',
    github_link: '',
    demo_link: '',
    faculty_mentor: '',
    status: 'Development' as ProjectStatus,
  });

  const fetchSkills = async () => {
    try {
      setLoadingSkills(true);
      const res = await skillService.getSkills();
      setSkills(res);
    } catch {
      toast.error('Failed to load skills');
    } finally {
      setLoadingSkills(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const res = await projectService.getProjects();
      setProjects(res);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchSkills();
    fetchProjects();
  }, []);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillForm.name.trim()) return;

    try {
      await skillService.addSkill(skillForm);
      toast.success('Skill Added', `${skillForm.name} added to your profile.`);
      setIsAddSkillOpen(false);
      setSkillForm({
        name: '',
        category: 'Programming',
        proficiency: 'INTERMEDIATE',
      });
      fetchSkills();
    } catch {
      toast.error('Error', 'Could not add skill.');
    }
  };

  const handleDeleteSkill = async (id: number) => {
    await skillService.deleteSkill(id);
    toast.info('Skill Removed');
    fetchSkills();
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title.trim()) return;

    const sanitizedGithub = projectForm.github_link ? sanitizeUrl(projectForm.github_link) : '';
    const sanitizedDemo = projectForm.demo_link ? sanitizeUrl(projectForm.demo_link) : '';

    if (sanitizedGithub === '#' || sanitizedDemo === '#') {
      toast.warning('Invalid URL', 'Please enter a valid external web link (javascript: is blocked).');
      return;
    }

    try {
      await projectService.createProject({
        ...projectForm,
        github_link: sanitizedGithub,
        demo_link: sanitizedDemo,
      });
      toast.success('Project Created', `${projectForm.title} added to your showcase.`);
      setIsAddProjectOpen(false);
      setProjectForm({
        title: '',
        description: '',
        technologies: '',
        team_members: '',
        github_link: '',
        demo_link: '',
        faculty_mentor: '',
        status: 'Development',
      });
      fetchProjects();
    } catch {
      toast.error('Error', 'Could not create project.');
    }
  };

  const handleDeleteProject = async (id: number) => {
    try {
      await projectService.deleteProject(id);
      toast.info('Project Deleted', 'Your project showcase has been removed.');
      fetchProjects();
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const proficiencyColorMap = {
    BEGINNER: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    INTERMEDIATE: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
    ADVANCED: 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300',
    EXPERT: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Skills & Project Showcase"
        subtitle="Manage verified competencies and showcase software engineering projects"
        action={
          activeTab === 'skills' ? (
            <Button
              onClick={() => setIsAddSkillOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Skill
            </Button>
          ) : (
            <Button
              onClick={() => setIsAddProjectOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              New Project
            </Button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex items-center justify-between gap-4">
        <Tabs
          tabs={[
            { id: 'skills', label: 'Technical Skills', count: skills.length, icon: <Code className="h-4 w-4" /> },
            { id: 'projects', label: 'Project Portfolio', count: projects.length, icon: <FolderGit2 className="h-4 w-4" /> },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Skills Tab Content */}
      {activeTab === 'skills' && (
        <>
          {loadingSkills ? (
            <LoadingSkeleton rows={4} />
          ) : skills.length === 0 ? (
            <EmptyState
              title="No Skills Logged"
              description="Add programming languages, frameworks, or database proficiencies to improve your placement readiness."
              actionText="Add First Skill"
              onAction={() => setIsAddSkillOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {skills.map((skill) => (
                <Card
                  key={skill.id}
                  hover
                  className="flex items-center justify-between p-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {skill.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">
                        {skill.category}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                          proficiencyColorMap[skill.proficiency]
                        }`}
                      >
                        {skill.proficiency}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteSkill(skill.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    title="Remove skill"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Projects Tab Content */}
      {activeTab === 'projects' && (
        <>
          {loadingProjects ? (
            <LoadingSkeleton rows={4} />
          ) : projects.length === 0 ? (
            <EmptyState
              title="No Projects Showcase"
              description="Showcase your full-stack applications, hackathon prototypes, or research projects."
              actionText="Create Project"
              onAction={() => setIsAddProjectOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {projects.map((proj) => (
                <Card key={proj.id} hover className="flex flex-col justify-between p-5 space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {proj.title}
                      </h3>
                      <Badge variant="primary" size="sm">
                        {proj.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {proj.description}
                    </p>

                    {proj.technologies && (
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                        Tech: {proj.technologies}
                      </div>
                    )}

                    {proj.faculty_mentor && (
                      <p className="text-[11px] text-slate-400">
                        Mentor: {proj.faculty_mentor}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                      {proj.github_link && sanitizeUrl(proj.github_link) !== '#' && (
                        <a
                          href={sanitizeUrl(proj.github_link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-primary-600 dark:text-slate-300"
                        >
                          <GithubIcon className="h-3.5 w-3.5" /> Code
                        </a>
                      )}
                      {proj.demo_link && sanitizeUrl(proj.demo_link) !== '#' && (
                        <a
                          href={sanitizeUrl(proj.demo_link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Live Demo
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteProject(proj.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Skill Modal */}
      <Modal
        isOpen={isAddSkillOpen}
        onClose={() => setIsAddSkillOpen(false)}
        title="Add Technical Skill"
        description="Add a competency to your verified technical profile."
      >
        <form onSubmit={handleAddSkill} className="space-y-4">
          <Input
            label="Skill Name"
            required
            value={skillForm.name}
            onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
            placeholder="e.g. React, PostgreSQL, Docker"
          />

          <Select
            label="Category"
            value={skillForm.category}
            onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value as SkillCategory })}
            options={SKILL_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />

          <Select
            label="Proficiency Level"
            value={skillForm.proficiency}
            onChange={(e) => setSkillForm({ ...skillForm, proficiency: e.target.value as SkillProficiency })}
            options={PROFICIENCIES.map((p) => ({ value: p, label: p }))}
          />

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddSkillOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Save Skill
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Project Modal */}
      <Modal
        isOpen={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        title="Add Showcase Project"
        description="Log an engineering project with GitHub links and live demos."
      >
        <form onSubmit={handleAddProject} className="space-y-4">
          <Input
            label="Project Title"
            required
            value={projectForm.title}
            onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
            placeholder="e.g. Distributed Task Queue Service"
          />

          <Textarea
            label="Description"
            required
            value={projectForm.description}
            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
            placeholder="Describe the architecture, problem solved, and key features..."
            rows={3}
          />

          <Input
            label="Technologies Used"
            value={projectForm.technologies}
            onChange={(e) => setProjectForm({ ...projectForm, technologies: e.target.value })}
            placeholder="e.g. React, Node.js, Redis, PostgreSQL"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="GitHub Repository URL"
              type="url"
              value={projectForm.github_link}
              onChange={(e) => setProjectForm({ ...projectForm, github_link: e.target.value })}
              placeholder="https://github.com/username/project"
            />
            <Input
              label="Live Demo URL (Optional)"
              type="url"
              value={projectForm.demo_link}
              onChange={(e) => setProjectForm({ ...projectForm, demo_link: e.target.value })}
              placeholder="https://myproject.demo"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Faculty Mentor (Optional)"
              value={projectForm.faculty_mentor}
              onChange={(e) => setProjectForm({ ...projectForm, faculty_mentor: e.target.value })}
              placeholder="e.g. Dr. Rajesh Sharma"
            />
            <Select
              label="Project Status"
              value={projectForm.status}
              onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as ProjectStatus })}
              options={PROJECT_STATUSES.map((s) => ({ value: s, label: s }))}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddProjectOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Save Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
