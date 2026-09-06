import React, { useEffect, useState } from 'react';
import { academicResultService } from '../services/academicResultService';
import { SubjectResult, SemesterResultSummary, OfficialDocumentRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { TranscriptBonafideModal } from '../components/TranscriptBonafideModal';
import { documentGeneratorService } from '../services/documentGeneratorService';
import { useToast } from '../context/ToastContext';
import {
  Award,
  GraduationCap,
  TrendingUp,
  FileCheck,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Lock,
  Layers,
  BookOpen,
  Sparkles,
  Calendar,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Building2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const ExamResultsPage: React.FC = () => {
  const { user } = useAuth();
  const isFacultyOrAdmin = user?.role !== 'STUDENT';
  const toast = useToast();

  const [selectedSemester, setSelectedSemester] = useState(5);
  const [subjects, setSubjects] = useState<SubjectResult[]>([]);
  const [summary, setSummary] = useState<SemesterResultSummary | null>(null);
  const [allSemesters, setAllSemesters] = useState<SemesterResultSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Transcript Preview Modal State
  const [transcriptDoc, setTranscriptDoc] = useState<OfficialDocumentRecord | null>(null);
  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);
  const [generatingDoc, setGeneratingDoc] = useState(false);

  const [editingResult, setEditingResult] = useState<SubjectResult | null>(null);
  const [editMarks, setEditMarks] = useState({ internal: 0, practical: 0, endTerm: 0 });
  const [editReason, setEditReason] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Admin / Faculty State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentsList, setStudentsList] = useState<any[]>([]);

  // Add Result State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [availableExams, setAvailableExams] = useState<any[]>([]);
  const [newResultForm, setNewResultForm] = useState({
    subject_id: '',
    examination_id: '',
    internal: 0,
    practical: 0,
    endTerm: 0,
  });
  const [addingResult, setAddingResult] = useState(false);

  // Examination Management State
  const [examinations, setExaminations] = useState<any[]>([]);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [examForm, setExamForm] = useState({
    name: '',
    type: 'END_TERM',
    semester: 5,
    department_id: '',
    academic_year: '2025-2026',
    start_date: '',
    end_date: '',
    is_published: true,
  });
  const [savingExam, setSavingExam] = useState(false);
  const [pendingDeleteExam, setPendingDeleteExam] = useState<{ id: number; name: string } | null>(null);
  const [isDeletingExam, setIsDeletingExam] = useState(false);

  const fetchExaminations = async () => {
    try {
      const data = await academicResultService.getExaminations({ semester: selectedSemester });
      setExaminations(data);
    } catch (err) {
      console.error('Failed to load examinations', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { supabase } = await import('../services/supabaseClient');
      const { data } = await supabase.from('departments').select('id, name, code').order('name');
      if (data && data.length > 0) {
        setDepartments(data);
        if (!examForm.department_id) {
          setExamForm(prev => ({ ...prev, department_id: String(data[0].id) }));
        }
      }
    } catch (err) {
      console.error('Failed to load departments', err);
    }
  };

  const fetchResults = async (studentIdToFetch?: string) => {
    setLoading(true);
    try {
      // If admin and no student selected, we might want to skip fetching or fetch first student
      const idToFetch = isFacultyOrAdmin ? (studentIdToFetch || selectedStudentId) : undefined;
      
      if (isFacultyOrAdmin && !idToFetch) {
        setSubjects([]);
        setSummary(null);
        setAllSemesters([]);
        return;
      }

      const data = await academicResultService.getStudentSemesterResults(idToFetch, selectedSemester);
      setSubjects(data.subjects);
      setSummary(data.summary);
      setAllSemesters(data.allSemesters);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (!isFacultyOrAdmin) return;
    const { supabase } = await import('../services/supabaseClient');
    const { data } = await supabase.from('users').select('id, first_name, last_name, email').eq('role', 'STUDENT');
    if (data && data.length > 0) {
      setStudentsList(data);
      if (!selectedStudentId) {
        setSelectedStudentId(data[0].id);
        fetchResults(data[0].id);
      }
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchExaminations();
    if (!isFacultyOrAdmin || selectedStudentId) {
      fetchResults();
    }
  }, [selectedSemester]);

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedStudentId(val);
    fetchResults(val);
  };

      const handleOpenTranscript = async () => {
    setGeneratingDoc(true);
    try {
      const overallCGPA = allSemesters.length > 0 ? allSemesters[allSemesters.length - 1].cumulative_cgpa : 8.92;
      const credits = 101; // Mock credits
      const fakeProfile: any = { user: { first_name: user?.first_name, last_name: user?.last_name } };
      const doc = await documentGeneratorService.generateTranscript(selectedStudentId || user?.id || 1, fakeProfile, Number(overallCGPA), credits);
      setTranscriptDoc(doc);
      setTranscriptModalOpen(true);
      toast.success('Official Transcript Generated! 📜');
    } catch {
      toast.error('Failed to generate transcript');
    } finally {
      setGeneratingDoc(false);
    }
  };

  const handleSaveGradeEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResult || !editReason.trim()) {
      toast.warning('Please provide an administrative audit reason for grade modification.');
      return;
    }

    setSavingEdit(true);
    try {
      await academicResultService.updateSubjectMarks(
        editingResult.id,
        {
          internal_marks: editMarks.internal,
          practical_marks: editMarks.practical,
          end_term_marks: editMarks.endTerm,
        },
        editReason.trim()
      );
      toast.success('Grades Updated Successfully! 📊');
      setEditingResult(null);
      fetchResults();
    } catch (err: any) {
      toast.error('Failed to update marks', err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenExamModal = () => {
    setExamForm({
      name: `Semester ${selectedSemester} End-Term Examination`,
      type: 'END_TERM',
      semester: selectedSemester,
      department_id: departments[0]?.id ? String(departments[0].id) : '1',
      academic_year: '2025-2026',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      is_published: true,
    });
    setIsExamModalOpen(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.name.trim()) {
      toast.warning('Please enter an examination name.');
      return;
    }
    setSavingExam(true);
    try {
      await academicResultService.createExamination({
        name: examForm.name,
        type: examForm.type,
        semester: Number(examForm.semester),
        department_id: Number(examForm.department_id) || departments[0]?.id || 1,
        academic_year: examForm.academic_year,
        start_date: examForm.start_date,
        end_date: examForm.end_date,
        is_published: examForm.is_published,
      });
      toast.success('Examination Scheduled!', 'The exam term is now active and ready for marks entry.');
      setIsExamModalOpen(false);
      fetchExaminations();
      // Reload available exams if Add Marks modal is active
      const exams = await academicResultService.getExaminations({ semester: selectedSemester });
      setAvailableExams(exams);
      if (exams.length > 0) {
        setNewResultForm(prev => ({ ...prev, examination_id: String(exams[0].id) }));
      }
    } catch (err: any) {
      toast.error('Failed to create examination', err.message);
    } finally {
      setSavingExam(false);
    }
  };

  const handleTogglePublish = async (examId: number, currentStatus: boolean) => {
    try {
      await academicResultService.togglePublishExamination(examId, !currentStatus);
      toast.success(!currentStatus ? 'Exam Results Published!' : 'Exam Set to Draft');
      fetchExaminations();
    } catch (err: any) {
      toast.error('Failed to update status', err.message);
    }
  };

  const handleDeleteExam = async (examId: number, examName: string) => {
    setPendingDeleteExam({ id: examId, name: examName });
  };

  const confirmDeleteExam = async () => {
    if (!pendingDeleteExam) return;
    setIsDeletingExam(true);
    try {
      await academicResultService.deleteExamination(pendingDeleteExam.id);
      toast.info('Examination Deleted');
      setPendingDeleteExam(null);
      fetchExaminations();
      fetchResults();
    } catch (err: any) {
      toast.error('Failed to delete examination', err.message);
    } finally {
      setIsDeletingExam(false);
    }
  };

  const handleOpenAddModal = async () => {
    if (!selectedStudentId) {
      toast.warning('Please select a student first');
      return;
    }
    
    setIsAddModalOpen(true);
    setNewResultForm({
      subject_id: '',
      examination_id: examinations.length > 0 ? String(examinations[0].id) : '',
      internal: 0,
      practical: 0,
      endTerm: 0,
    });

    try {
      const { supabase } = await import('../services/supabaseClient');
      const [subRes, examRes] = await Promise.all([
        supabase.from('subjects').select('*').eq('semester', selectedSemester),
        academicResultService.getExaminations({ semester: selectedSemester }),
      ]);
      if (subRes.data) {
        setAvailableSubjects(subRes.data);
        if (subRes.data.length > 0) {
          setNewResultForm(prev => ({ ...prev, subject_id: String(subRes.data[0].id) }));
        }
      }
      if (examRes) {
        setAvailableExams(examRes);
        if (examRes.length > 0) {
          setNewResultForm(prev => ({ ...prev, examination_id: String(examRes[0].id) }));
        }
      }
    } catch (err) {
      toast.error('Failed to load available subjects/exams');
    }
  };

  const handleSaveNewResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResultForm.subject_id || !newResultForm.examination_id) {
      toast.warning('Please select both a subject and an examination.');
      return;
    }

    setAddingResult(true);
    try {
      await academicResultService.addSubjectMarks(
        selectedStudentId,
        Number(newResultForm.subject_id),
        Number(newResultForm.examination_id),
        {
          internal_marks: newResultForm.internal,
          practical_marks: newResultForm.practical,
          end_term_marks: newResultForm.endTerm,
        }
      );
      toast.success('Course Result Added Successfully!');
      setIsAddModalOpen(false);
      fetchResults();
    } catch (err: any) {
      toast.error('Failed to add marks', err.message);
    } finally {
      setAddingResult(false);
    }
  };

  const trendData = allSemesters.map((s) => ({
    semester: `Sem ${s.semester}`,
    sgpa: s.sgpa,
    cgpa: s.cumulative_cgpa,
  }));

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Semester Examination Results & Grades"
        subtitle="Official course grade sheets, credit scores, SGPA/CGPA performance, and verified transcripts"
        badge={
          <Badge variant="success" size="sm" dot>
            Controller of Examinations Verified
          </Badge>
        }
        action={
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            {isFacultyOrAdmin && (
              <>
                <select
                  value={selectedStudentId}
                  onChange={handleStudentChange}
                  className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white"
                >
                  <option value="" disabled>Select a Student</option>
                  {studentsList.map(s => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.email})</option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  onClick={handleOpenExamModal}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add Exam
                </Button>
                <Button
                  variant="primary"
                  onClick={handleOpenAddModal}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                >
                  Add Marks
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={handleOpenTranscript}
              isLoading={generatingDoc}
              leftIcon={<FileCheck className="h-4 w-4 text-blue-500" />}
            >
              Generate Official Transcript
            </Button>
          </div>
        }
      />

      {/* KPI Metric Summary Banner */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Current SGPA"
          value={
            summary && summary.total_credits_registered > 0 && typeof summary.sgpa === 'number' && !isNaN(summary.sgpa)
              ? `${summary.sgpa.toFixed(2)} / 10.0`
              : 'N/A'
          }
          icon={Award}
          color="emerald"
          subtitle={`Semester ${selectedSemester} Performance`}
          trend={summary && summary.sgpa >= 8.5 ? { value: "Dean's Honor Standing", isPositive: true } : undefined}
        />
        <StatCard
          title="Cumulative CGPA"
          value={
            summary && typeof summary.cumulative_cgpa === 'number' && summary.cumulative_cgpa > 0 && !isNaN(summary.cumulative_cgpa)
              ? `${summary.cumulative_cgpa.toFixed(2)} / 10.0`
              : 'N/A'
          }
          icon={GraduationCap}
          color="blue"
          subtitle="Cumulative Score"
        />
        <StatCard
          title="Registered Credits"
          value={summary?.total_credits_registered ?? 0}
          icon={Layers}
          color="purple"
          subtitle="Academic Units"
        />
        <StatCard
          title="Earned Credits"
          value={summary?.total_credits_earned ?? 0}
          icon={CheckCircle2}
          color="cyan"
          subtitle={
            summary && summary.total_credits_registered > 0
              ? `${Math.round((summary.total_credits_earned / summary.total_credits_registered) * 100)}% Completion`
              : '0% Completion'
          }
          progress={
            summary && summary.total_credits_registered > 0
              ? Math.round((summary.total_credits_earned / summary.total_credits_registered) * 100)
              : 0
          }
        />
      </div>

      {/* Semester Selector Tabs */}
      <div className="flex items-center gap-2 p-2 rounded-3xl bg-white dark:bg-midnight-900 border border-slate-200 dark:border-white/5 shadow-2xs overflow-x-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
          <button
            key={sem}
            onClick={() => setSelectedSemester(sem)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              selectedSemester === sem
                ? 'bg-blue-600 text-white shadow-glow-sm'
                : 'bg-slate-50 dark:bg-midnight-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Semester {sem} {sem === 5 && '(Current)'}
          </button>
        ))}
      </div>

      {/* Active Examinations for Selected Semester */}
      <div className="p-4 rounded-3xl bg-white dark:bg-midnight-900 border border-slate-200 dark:border-white/5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              Examinations for Semester {selectedSemester}
            </h3>
            <p className="text-xs text-slate-500">
              Scheduled examination terms, publication status, and grading windows.
            </p>
          </div>
          {isFacultyOrAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenExamModal}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Add Exam
            </Button>
          )}
        </div>

        {examinations.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-midnight-950 border border-dashed border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>No formal examinations scheduled for Semester {selectedSemester}.</span>
            {isFacultyOrAdmin && (
              <Button size="xs" variant="primary" onClick={handleOpenExamModal} leftIcon={<Plus className="h-3 w-3" />}>
                Create Semester {selectedSemester} Exam
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {examinations.map((ex) => (
              <div
                key={ex.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-midnight-950/70 space-y-2 hover:border-blue-300 dark:hover:border-blue-900/50 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {ex.name}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="primary" size="sm">
                        {ex.type.replace('_', ' ')}
                      </Badge>
                      {ex.departments?.name && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          {ex.departments.code || ex.departments.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant={ex.is_published ? 'success' : 'warning'} size="sm" dot>
                    {ex.is_published ? 'Published' : 'Draft'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-white/5">
                  <span>
                    {ex.start_date ? new Date(ex.start_date).toLocaleDateString() : 'TBD'}
                    {ex.end_date ? ` – ${new Date(ex.end_date).toLocaleDateString()}` : ''}
                  </span>
                  
                  {isFacultyOrAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePublish(ex.id, ex.is_published)}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
                        title={ex.is_published ? 'Unpublish Results' : 'Publish Results'}
                      >
                        {ex.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => {
                          setNewResultForm(prev => ({ ...prev, examination_id: String(ex.id) }));
                          handleOpenAddModal();
                        }}
                        className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100"
                        title="Enter student marks for this exam"
                      >
                        Enter Marks
                      </button>
                      <button
                        onClick={() => handleDeleteExam(ex.id, ex.name)}
                        className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/30 text-rose-500"
                        title="Delete Exam"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Results Table & Charts Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formal Marksheet Table (Left 8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="overflow-hidden border border-slate-200 dark:border-white/5">
            <div className="p-4 bg-slate-50/50 dark:bg-midnight-950/50 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Semester {selectedSemester} Subjects & Grades
                </h3>
                <p className="text-xs text-slate-500">
                  Academic Year: {summary?.academic_year || '2025-2026'} &bull; Program: B.Tech in CSE
                </p>
              </div>
              <Badge variant="success" size="sm" dot>
                {summary?.status || 'PASSED'}
              </Badge>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-950 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-3">Course Code</th>
                    <th className="p-3">Subject Name</th>
                    <th className="p-3 text-center">Credits</th>
                    <th className="p-3 text-center">Int (30)</th>
                    <th className="p-3 text-center">Prac (20)</th>
                    <th className="p-3 text-center">End (50)</th>
                    <th className="p-3 text-center">Total</th>
                    <th className="p-3 text-center">Grade</th>
                    <th className="p-3 text-center">Points</th>
                    {isFacultyOrAdmin && <th className="p-3 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {subjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-midnight-850/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {sub.subject_code}
                      </td>
                      <td className="p-3 font-medium text-slate-900 dark:text-white max-w-[200px] truncate">
                        {sub.subject_name}
                      </td>
                      <td className="p-3 text-center font-bold">{sub.credits}</td>
                      <td className="p-3 text-center font-mono">{sub.internal_marks}</td>
                      <td className="p-3 text-center font-mono">{sub.practical_marks}</td>
                      <td className="p-3 text-center font-mono">{sub.end_term_marks}</td>
                      <td className="p-3 text-center font-bold font-mono">{sub.total_marks}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${
                            sub.grade === 'O'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {sub.grade}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold">{sub.credit_points}</td>
                      {isFacultyOrAdmin && (
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setEditingResult(sub);
                              setEditMarks({
                                internal: sub.internal_marks,
                                practical: sub.practical_marks,
                                endTerm: sub.end_term_marks,
                              });
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="Audit / Edit Marks"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
              {subjects.map((sub) => (
                <div key={sub.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">{sub.subject_code}</p>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{sub.subject_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${
                        sub.grade === 'O'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}>
                        {sub.grade}
                      </span>
                      {isFacultyOrAdmin && (
                        <button
                          onClick={() => {
                            setEditingResult(sub);
                            setEditMarks({ internal: sub.internal_marks, practical: sub.practical_marks, endTerm: sub.end_term_marks });
                          }}
                          className="p-1 rounded-lg bg-slate-100 dark:bg-midnight-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-center text-xs bg-slate-50 dark:bg-midnight-950 p-2 rounded-xl">
                    <div>
                      <p className="text-slate-400 mb-0.5">Int</p>
                      <p className="font-mono font-medium">{sub.internal_marks}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-0.5">Prac</p>
                      <p className="font-mono font-medium">{sub.practical_marks}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-0.5">End</p>
                      <p className="font-mono font-medium">{sub.end_term_marks}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-0.5">Total</p>
                      <p className="font-mono font-bold text-slate-900 dark:text-white">{sub.total_marks}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Academic Trends & Standing Card (Right 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                SGPA Performance Trajectory
              </h4>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="sgpaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="semester" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis domain={[7.5, 10.0]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sgpa"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#sgpaGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-midnight-950 border border-slate-100 dark:border-white/5 space-y-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Grading Scale Key
              </span>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                <span>O (Outstanding) = 10 pts</span>
                <span>A+ (Excellent) = 9 pts</span>
                <span>A (Very Good) = 8 pts</span>
                <span>B+ (Good) = 7 pts</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Official Transcript Preview Modal */}
      <TranscriptBonafideModal
        isOpen={transcriptModalOpen}
        onClose={() => setTranscriptModalOpen(false)}
        document={transcriptDoc}
      />

      {/* Grade Edit Modal */}
      {editingResult && (
        <Modal
          isOpen={Boolean(editingResult)}
          onClose={() => setEditingResult(null)}
          title={`Audit Marks: ${editingResult.subject_code}`}
          size="md"
        >
          <form onSubmit={handleSaveGradeEdit} className="space-y-4">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
              <strong className="block font-bold">Official Examination Policy:</strong>
              All grade revisions require an administrative reason and are logged permanently in the system records.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Internal (30)</label>
                <input
                  type="number"
                  max={30}
                  value={editMarks.internal}
                  onChange={(e) => setEditMarks({ ...editMarks, internal: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Practical (20)</label>
                <input
                  type="number"
                  max={20}
                  value={editMarks.practical}
                  onChange={(e) => setEditMarks({ ...editMarks, practical: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">End-Term (50)</label>
                <input
                  type="number"
                  max={50}
                  value={editMarks.endTerm}
                  onChange={(e) => setEditMarks({ ...editMarks, endTerm: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Audit Justification / Reason *</label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Re-evaluation verified by Head of Department..."
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <Button variant="outline" size="sm" type="button" onClick={() => setEditingResult(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={savingEdit}>
                Confirm Grade Revision
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Marks Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={`Add Marks for Semester ${selectedSemester}`}
          size="md"
        >
          <form onSubmit={handleSaveNewResult} className="space-y-4">
            {availableExams.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  No Examination Scheduled for Semester {selectedSemester}
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  You must create an examination term for this semester before recording student marks.
                </p>
                <Button
                  size="xs"
                  variant="primary"
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    handleOpenExamModal();
                  }}
                  leftIcon={<Plus className="h-3 w-3" />}
                >
                  Create Examination Now
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Examination</label>
                <select
                  required
                  value={newResultForm.examination_id}
                  onChange={(e) => setNewResultForm({ ...newResultForm, examination_id: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white"
                >
                  <option value="" disabled>Select an examination...</option>
                  {availableExams.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name} ({ex.type})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Subject</label>
              <select
                required
                value={newResultForm.subject_id}
                onChange={(e) => setNewResultForm({ ...newResultForm, subject_id: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white"
              >
                <option value="" disabled>Select a subject...</option>
                {availableSubjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.code}: {sub.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Internal (30)</label>
                <input
                  type="number"
                  max={30}
                  required
                  value={newResultForm.internal}
                  onChange={(e) => setNewResultForm({ ...newResultForm, internal: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Practical (20)</label>
                <input
                  type="number"
                  max={20}
                  required
                  value={newResultForm.practical}
                  onChange={(e) => setNewResultForm({ ...newResultForm, practical: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">End-Term (50)</label>
                <input
                  type="number"
                  max={50}
                  required
                  value={newResultForm.endTerm}
                  onChange={(e) => setNewResultForm({ ...newResultForm, endTerm: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={addingResult} disabled={availableExams.length === 0}>
                Add Results
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create / Schedule Examination Modal */}
      {isExamModalOpen && (
        <Modal
          isOpen={isExamModalOpen}
          onClose={() => setIsExamModalOpen(false)}
          title={`Schedule Examination (Semester ${examForm.semester})`}
          size="md"
        >
          <form onSubmit={handleSaveExam} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Examination Name</label>
              <input
                type="text"
                required
                placeholder="e.g. End-Term Theory Examination 2025"
                value={examForm.name}
                onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Exam Type</label>
                <select
                  value={examForm.type}
                  onChange={(e) => setExamForm({ ...examForm, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white"
                >
                  <option value="END_TERM">End-Term Examination</option>
                  <option value="MID_TERM">Mid-Term Assessment (In-Sem)</option>
                  <option value="PRACTICAL">Practical / Lab Assessment</option>
                  <option value="INTERNAL">Continuous Internal Evaluation (CIE)</option>
                  <option value="RE_EXAM">Supplementary / Re-Exam</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Semester</label>
                <select
                  value={examForm.semester}
                  onChange={(e) => setExamForm({ ...examForm, semester: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department</label>
                <select
                  value={examForm.department_id}
                  onChange={(e) => setExamForm({ ...examForm, department_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Academic Year</label>
                <input
                  type="text"
                  placeholder="2025-2026"
                  value={examForm.academic_year}
                  onChange={(e) => setExamForm({ ...examForm, academic_year: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Start Date</label>
                <input
                  type="date"
                  value={examForm.start_date}
                  onChange={(e) => setExamForm({ ...examForm, start_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">End Date</label>
                <input
                  type="date"
                  value={examForm.end_date}
                  onChange={(e) => setExamForm({ ...examForm, end_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-midnight-950 border border-slate-100 dark:border-white/5">
              <input
                type="checkbox"
                id="exam_is_published"
                checked={examForm.is_published}
                onChange={(e) => setExamForm({ ...examForm, is_published: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <label htmlFor="exam_is_published" className="text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                Publish results to students immediately once entered
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsExamModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={savingExam}>
                Create Examination
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {/* Delete Exam Confirmation Modal */}
      {pendingDeleteExam && (
        <Modal
          isOpen={Boolean(pendingDeleteExam)}
          onClose={() => setPendingDeleteExam(null)}
          title="Delete Examination"
          description={`Are you sure you want to delete "${pendingDeleteExam.name}"? All associated student results will also be permanently deleted.`}
          size="sm"
        >
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
            <Button variant="outline" size="sm" onClick={() => setPendingDeleteExam(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isDeletingExam}
              className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-500"
              onClick={confirmDeleteExam}
            >
              Delete Permanently
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};


