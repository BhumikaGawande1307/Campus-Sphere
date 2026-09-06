import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import {
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Building2,
  Users,
  GraduationCap,
  Search,
  X,
  LayoutGrid,
  List,
  ChevronDown,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

interface Department {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  hod_id?: string | null;
  created_at: string;
  hod?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  } | null;
}

interface Subject {
  id: number;
  code: string;
  name: string;
  department_id: number;
  semester: number;
  credits: number;
  type: string;
  is_elective?: boolean;
  created_at: string;
  departments?: {
    id: number;
    name: string;
    code: string;
  } | null;
}

interface FacultyUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

export const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [facultyUsers, setFacultyUsers] = useState<FacultyUser[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<number, number>>({});
  const [facultyCounts, setFacultyCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'departments' | 'subjects'>('departments');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Subject filters
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedSemFilter, setSelectedSemFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // Modals
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedDeptForDetails, setSelectedDeptForDetails] = useState<Department | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'department' | 'subject';
    id: number;
    name: string;
    count?: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [deptForm, setDeptForm] = useState({
    code: '',
    name: '',
    description: '',
    hod_id: '',
  });

  const [subjectForm, setSubjectForm] = useState({
    code: '',
    name: '',
    department_id: 1,
    semester: 1,
    credits: 3.0,
    type: 'THEORY',
    is_elective: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch departments with linked HOD
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*, hod:users!hod_id(id, first_name, last_name, email, avatar_url)')
        .order('name');
      if (deptError) throw deptError;
      setDepartments((deptData as Department[]) || []);

      // 2. Fetch subjects with department information
      const { data: subData, error: subError } = await supabase
        .from('subjects')
        .select('*, departments(id, name, code)')
        .order('code');
      if (subError) throw subError;
      setSubjects((subData as Subject[]) || []);

      // 3. Fetch faculty/admin users for HOD appointment
      const { data: facData } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role, avatar_url')
        .in('role', ['FACULTY', 'HOD', 'ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR'])
        .order('first_name');
      setFacultyUsers((facData as FacultyUser[]) || []);

      // 4. Fetch department student counts
      try {
        const { data: stus } = await supabase
          .from('students')
          .select('id, department_id');
        if (stus) {
          const sCounts: Record<number, number> = {};
          stus.forEach((s: any) => {
            if (s.department_id) {
              sCounts[s.department_id] = (sCounts[s.department_id] || 0) + 1;
            }
          });
          setStudentCounts(sCounts);
        }
      } catch {
        // Students count fallback
      }

      // 5. Fetch department faculty counts
      try {
        const { data: facs } = await supabase
          .from('faculty')
          .select('id, department_id');
        if (facs) {
          const fCounts: Record<number, number> = {};
          facs.forEach((f: any) => {
            if (f.department_id) {
              fCounts[f.department_id] = (fCounts[f.department_id] || 0) + 1;
            }
          });
          setFacultyCounts(fCounts);
        }
      } catch {
        // Faculty count fallback
      }
    } catch (err: any) {
      toast.error('Failed to load academic data', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Department CRUD
  const handleOpenCreateDept = () => {
    setEditingItem(null);
    setDeptForm({
      code: '',
      name: '',
      description: '',
      hod_id: '',
    });
    setShowDeptModal(true);
  };

  const handleOpenEditDept = (dept: Department) => {
    setEditingItem(dept);
    setDeptForm({
      code: dept.code || '',
      name: dept.name || '',
      description: dept.description || '',
      hod_id: dept.hod_id || '',
    });
    setShowDeptModal(true);
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.code.trim() || !deptForm.name.trim()) {
      toast.error('Validation Error', 'Department Code and Name are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        code: deptForm.code.trim().toUpperCase(),
        name: deptForm.name.trim(),
        description: deptForm.description.trim() || null,
        hod_id: deptForm.hod_id.trim() ? deptForm.hod_id : null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('departments')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Department updated successfully');
      } else {
        const { error } = await supabase
          .from('departments')
          .insert(payload);
        if (error) throw error;
        toast.success('Department created successfully');
      }

      setShowDeptModal(false);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to save department', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Subject CRUD
  const handleOpenCreateSubject = (preSelectedDeptId?: number) => {
    setEditingItem(null);
    setSubjectForm({
      code: '',
      name: '',
      department_id: preSelectedDeptId || departments[0]?.id || 1,
      semester: 1,
      credits: 3.0,
      type: 'THEORY',
      is_elective: false,
    });
    setShowSubjectModal(true);
  };

  const handleOpenEditSubject = (sub: Subject) => {
    setEditingItem(sub);
    setSubjectForm({
      code: sub.code || '',
      name: sub.name || '',
      department_id: sub.department_id || departments[0]?.id || 1,
      semester: sub.semester || 1,
      credits: Number(sub.credits) || 3.0,
      type: sub.type || 'THEORY',
      is_elective: Boolean(sub.is_elective),
    });
    setShowSubjectModal(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.code.trim() || !subjectForm.name.trim()) {
      toast.error('Validation Error', 'Subject Code and Name are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        code: subjectForm.code.trim().toUpperCase(),
        name: subjectForm.name.trim(),
        department_id: Number(subjectForm.department_id),
        semester: Number(subjectForm.semester) || 1,
        credits: Number(subjectForm.credits) || 3.0,
        type: subjectForm.type || 'THEORY',
        is_elective: Boolean(subjectForm.is_elective),
      };

      if (editingItem) {
        const { error } = await supabase
          .from('subjects')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Subject updated successfully');
      } else {
        const { error } = await supabase
          .from('subjects')
          .insert(payload);
        if (error) throw error;
        toast.success('Subject created successfully');
      }

      setShowSubjectModal(false);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to save subject', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirm) return;
    setIsSubmitting(true);
    try {
      if (deleteConfirm.type === 'department') {
        const studentCount = studentCounts[deleteConfirm.id] || 0;
        const facultyCount = facultyCounts[deleteConfirm.id] || 0;
        const { count: subjectCount } = await supabase
          .from('subjects')
          .select('id', { count: 'exact', head: true })
          .eq('department_id', deleteConfirm.id);

        if (studentCount > 0 || facultyCount > 0 || (subjectCount && subjectCount > 0)) {
          throw new Error(
            `Cannot delete department "${deleteConfirm.name}" because it still contains ${studentCount} active student(s), ${facultyCount} faculty member(s), and ${subjectCount || 0} course subject(s). Please reassign them before deletion.`
          );
        }
      }

      const table = deleteConfirm.type === 'department' ? 'departments' : 'subjects';
      const { error } = await supabase.from(table).delete().eq('id', deleteConfirm.id);
      if (error) {
        if (error.code === '23503') {
          throw new Error('Cannot delete this item because it is referenced by existing records in the database.');
        }
        throw error;
      }

      toast.success(
        `${deleteConfirm.type === 'department' ? 'Department' : 'Subject'} removed successfully`
      );
      setDeleteConfirm(null);
      if (selectedDeptForDetails?.id === deleteConfirm.id) {
        setSelectedDeptForDetails(null);
      }
      fetchData();
    } catch (err: any) {
      toast.error('Delete failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPI Calculations
  const totalDepartments = departments.length;
  const totalSubjects = subjects.length;
  const totalStudents = Object.values(studentCounts).reduce((a, b) => a + b, 0);
  const totalFaculty = Object.values(facultyCounts).reduce((a, b) => a + b, 0);

  // Filtered Departments
  const filteredDepartments = useMemo(() => {
    if (!searchQuery.trim()) return departments;
    const q = searchQuery.toLowerCase();
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q)) ||
        (d.hod && `${d.hod.first_name} ${d.hod.last_name}`.toLowerCase().includes(q))
    );
  }, [departments, searchQuery]);

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.departments?.name && s.departments.name.toLowerCase().includes(q));

      const matchesDept =
        selectedDeptFilter === 'ALL' || String(s.department_id) === selectedDeptFilter;
      const matchesSem =
        selectedSemFilter === 'ALL' || String(s.semester) === selectedSemFilter;
      const matchesType =
        selectedTypeFilter === 'ALL' || s.type === selectedTypeFilter;

      return matchesSearch && matchesDept && matchesSem && matchesType;
    });
  }, [subjects, searchQuery, selectedDeptFilter, selectedSemFilter, selectedTypeFilter]);

  // Gradient badge for department codes
  const getDeptGradient = (code: string) => {
    const c = code.toUpperCase();
    if (c.includes('CS') || c.includes('COMP')) return 'from-blue-600 to-indigo-700 text-white';
    if (c.includes('IT') || c.includes('DATA')) return 'from-cyan-600 to-blue-700 text-white';
    if (c.includes('EC') || c.includes('EE')) return 'from-emerald-600 to-teal-700 text-white';
    if (c.includes('MECH') || c.includes('AUTO')) return 'from-amber-500 to-orange-600 text-white';
    if (c.includes('CIVIL') || c.includes('ARCH')) return 'from-slate-700 to-zinc-800 text-white';
    if (c.includes('BCA') || c.includes('MCA')) return 'from-violet-600 to-purple-700 text-white';
    return 'from-blue-600 to-indigo-600 text-white';
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-20 text-slate-900 dark:text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Academic Structure & Departments
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Manage institutional departments, faculty leadership, and curriculum modules.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            title="Refresh academic data"
            className="rounded-xl"
            leftIcon={<RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            className="rounded-xl shadow-glow-sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              if (activeTab === 'departments') {
                handleOpenCreateDept();
              } else {
                handleOpenCreateSubject();
              }
            }}
          >
            {activeTab === 'departments' ? 'New Department' : 'New Subject'}
          </Button>
        </div>
      </div>

      {/* Top Academic Analytics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-midnight-900/90 border border-slate-200/80 dark:border-white/10 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Departments</span>
            <Building2 className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalDepartments}</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Fully Operational</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-midnight-900/90 border border-slate-200/80 dark:border-white/10 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Subjects</span>
            <BookOpen className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalSubjects}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Curriculum Modules</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-midnight-900/90 border border-slate-200/80 dark:border-white/10 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Enrolled Students</span>
            <GraduationCap className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalStudents}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Across Departments</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-midnight-900/90 border border-slate-200/80 dark:border-white/10 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Faculty Members</span>
            <Users className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalFaculty}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Instructional Staff</span>
        </div>
      </div>

      {/* Tabs & View Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('departments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'departments'
                ? 'bg-blue-600 text-white shadow-glow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Departments
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'departments' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
              }`}
            >
              {departments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'subjects'
                ? 'bg-blue-600 text-white shadow-glow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Subjects & Courses
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'subjects' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
              }`}
            >
              {subjects.length}
            </span>
          </button>
        </div>

        {/* View mode toggle for departments */}
        {activeTab === 'departments' && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-midnight-950 border border-slate-200/80 dark:border-white/5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-midnight-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grid card view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-midnight-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table view"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'departments'
                  ? 'Search departments by code, name, or HOD...'
                  : 'Search subjects by code, title, or department...'
              }
              className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-white/10 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Subject-specific filters */}
          {activeTab === 'subjects' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-white/10 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
                >
                  <option value="ALL" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100">
                    All Departments
                  </option>
                  {departments.map((d) => (
                    <option
                      key={d.id}
                      value={String(d.id)}
                      className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100"
                    >
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={selectedSemFilter}
                  onChange={(e) => setSelectedSemFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-white/10 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
                >
                  <option value="ALL" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100">
                    All Semesters
                  </option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option
                      key={s}
                      value={String(s)}
                      className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100"
                    >
                      Semester {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-white/10 bg-white dark:bg-midnight-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
                >
                  <option value="ALL" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100">
                    All Course Types
                  </option>
                  <option value="THEORY" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100">
                    Theory
                  </option>
                  <option value="PRACTICAL" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100">
                    Practical / Lab
                  </option>
                  <option value="ELECTIVE" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100">
                    Elective
                  </option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              {(selectedDeptFilter !== 'ALL' || selectedSemFilter !== 'ALL' || selectedTypeFilter !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedDeptFilter('ALL');
                    setSelectedSemFilter('ALL');
                    setSelectedTypeFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="px-2.5 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <RotateCw className="h-7 w-7 animate-spin text-blue-500" />
          <p className="text-xs font-semibold">Synchronizing academic structure...</p>
        </div>
      ) : activeTab === 'departments' ? (
        viewMode === 'grid' ? (
          /* Departments Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDepartments.map((dept) => {
              const deptSubjects = subjects.filter((s) => s.department_id === dept.id);
              const studentCount = studentCounts[dept.id] || 0;
              const facultyCount = facultyCounts[dept.id] || 0;

              return (
                <div
                  key={dept.id}
                  className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-midnight-900/90 backdrop-blur-xl overflow-hidden shadow-2xs hover:-translate-y-1 hover:shadow-md transition-all duration-200"
                >
                  <div>
                    {/* Header Banner with Department Gradient */}
                    <div className={`p-4 bg-gradient-to-r ${getDeptGradient(dept.code)} flex items-center justify-between`}>
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-white text-base tracking-wider border border-white/30 shadow-xs">
                          {dept.code.substring(0, 3)}
                        </div>
                        <div>
                          <span className="px-2 py-0.5 rounded-md bg-black/20 text-[10px] font-mono font-bold uppercase tracking-wider text-white">
                            {dept.code}
                          </span>
                          <p className="text-xs text-white/80 font-medium">Department #{dept.id}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditDept(dept)}
                          className="h-7 w-7 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                          title="Edit Department"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              type: 'department',
                              id: dept.id,
                              name: dept.name,
                              count: deptSubjects.length,
                            })
                          }
                          className="h-7 w-7 rounded-xl bg-white/20 hover:bg-rose-500 text-white flex items-center justify-center transition-colors"
                          title="Delete Department"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 space-y-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {dept.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 min-h-[32px]">
                          {dept.description || 'No department scope description provided.'}
                        </p>
                      </div>

                      {/* Head of Department Info */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-midnight-950/80 border border-slate-200/80 dark:border-white/5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Head of Department (HOD)
                        </span>
                        {dept.hod ? (
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-500/20">
                              {dept.hod.first_name?.[0] || 'H'}
                              {dept.hod.last_name?.[0] || ''}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {dept.hod.first_name} {dept.hod.last_name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono truncate">{dept.hod.email}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> To Be Appointed
                            </span>
                            <button
                              onClick={() => handleOpenEditDept(dept)}
                              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Appoint HOD
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Metrics Chips */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-midnight-950/50 border border-slate-100 dark:border-white/5">
                          <span className="text-xs font-black text-slate-900 dark:text-white block">
                            {deptSubjects.length}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">Subjects</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-midnight-950/50 border border-slate-100 dark:border-white/5">
                          <span className="text-xs font-black text-slate-900 dark:text-white block">
                            {studentCount}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">Students</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-midnight-950/50 border border-slate-100 dark:border-white/5">
                          <span className="text-xs font-black text-slate-900 dark:text-white block">
                            {facultyCount}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">Faculty</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="px-5 pb-5 pt-1">
                    <button
                      onClick={() => setSelectedDeptForDetails(dept)}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-midnight-800 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      View Curriculum & Details
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredDepartments.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-midnight-900 flex items-center justify-center mx-auto text-slate-400 mb-3">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Departments Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchQuery ? 'No departments match your current search query.' : 'Create your first institutional department to get started.'}
                </p>
                {searchQuery ? (
                  <Button size="sm" variant="outline" className="mt-4" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                ) : (
                  <Button size="sm" className="mt-4" onClick={handleOpenCreateDept}>
                    Create Department
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Departments Table View */
          <div className="bg-white dark:bg-midnight-900/90 rounded-3xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4">Code</th>
                    <th className="p-4">Department Name</th>
                    <th className="p-4">Head of Dept (HOD)</th>
                    <th className="p-4 text-center">Subjects</th>
                    <th className="p-4 text-center">Students</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredDepartments.map((dept) => {
                    const deptSubjects = subjects.filter((s) => s.department_id === dept.id);
                    const studentCount = studentCounts[dept.id] || 0;

                    return (
                      <tr
                        key={dept.id}
                        className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4">
                          <span className="font-mono font-bold px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            {dept.code}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-900 dark:text-white">{dept.name}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{dept.description || 'No description'}</p>
                        </td>
                        <td className="p-4">
                          {dept.hod ? (
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                                {dept.hod.first_name?.[0] || 'H'}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                                  {dept.hod.first_name} {dept.hod.last_name}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">{dept.hod.email}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                              To Be Appointed
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="neutral" size="sm">
                            {deptSubjects.length} Modules
                          </Badge>
                        </td>
                        <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">
                          {studentCount}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="View Curriculum"
                              onClick={() => setSelectedDeptForDetails(dept)}
                            >
                              <BookOpen className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Edit Department"
                              onClick={() => handleOpenEditDept(dept)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                              title="Delete Department"
                              onClick={() =>
                                setDeleteConfirm({
                                  type: 'department',
                                  id: dept.id,
                                  name: dept.name,
                                  count: deptSubjects.length,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredDepartments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-500">
                        No departments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Subjects Tab View */
        <div className="bg-white dark:bg-midnight-900/90 rounded-3xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">Code</th>
                  <th className="p-4">Subject Name</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Semester</th>
                  <th className="p-4">Credits & Type</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredSubjects.map((sub) => {
                  const dept = departments.find((d) => d.id === sub.department_id);

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {sub.code}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900 dark:text-white">{sub.name}</p>
                        {sub.is_elective && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            ★ Elective
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {dept?.name || sub.departments?.name || 'General Academic'}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {dept?.code || sub.departments?.code || 'GEN'}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge variant="neutral" size="sm">
                          Semester {sub.semester}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold">
                            {sub.credits} Credits
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                              sub.type === 'PRACTICAL'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : sub.type === 'ELECTIVE'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {sub.type || 'THEORY'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Edit Subject"
                            onClick={() => handleOpenEditSubject(sub)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                            title="Delete Subject"
                            onClick={() =>
                              setDeleteConfirm({
                                type: 'subject',
                                id: sub.id,
                                name: sub.name,
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredSubjects.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                      <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-midnight-950 flex items-center justify-center mx-auto mb-2 text-slate-400">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white">No Subjects Found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try clearing active filters or create a new subject module.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Department Details & Curriculum Modal ── */}
      {selectedDeptForDetails && (
        <Modal
          isOpen={Boolean(selectedDeptForDetails)}
          onClose={() => setSelectedDeptForDetails(null)}
          title={selectedDeptForDetails.name}
          description={`Comprehensive curriculum overview and departmental stats for ${selectedDeptForDetails.code}`}
          size="2xl"
        >
          <div className="space-y-5">
            {/* Header Card */}
            <div className={`p-5 rounded-2xl bg-gradient-to-r ${getDeptGradient(selectedDeptForDetails.code)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-1 rounded-lg bg-black/20 text-xs font-mono font-bold uppercase text-white">
                    {selectedDeptForDetails.code}
                  </span>
                  <h3 className="text-xl font-black text-white mt-1">{selectedDeptForDetails.name}</h3>
                  <p className="text-xs text-white/80 mt-1 max-w-lg">
                    {selectedDeptForDetails.description || 'No formal description logged for this department.'}
                  </p>
                </div>
                <Building2 className="h-12 w-12 text-white/20 shrink-0" />
              </div>
            </div>

            {/* Quick Stats Grid */}
            {(() => {
              const deptSubjects = subjects.filter((s) => s.department_id === selectedDeptForDetails.id);
              const totalCredits = deptSubjects.reduce((acc, s) => acc + (Number(s.credits) || 0), 0);
              const studentCount = studentCounts[selectedDeptForDetails.id] || 0;
              const facultyCount = facultyCounts[selectedDeptForDetails.id] || 0;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-midnight-800 border border-slate-200/80 dark:border-white/5">
                    <span className="text-lg font-black text-slate-900 dark:text-white block">
                      {deptSubjects.length}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Modules</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-midnight-800 border border-slate-200/80 dark:border-white/5">
                    <span className="text-lg font-black text-slate-900 dark:text-white block">
                      {totalCredits}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Curriculum Credits</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-midnight-800 border border-slate-200/80 dark:border-white/5">
                    <span className="text-lg font-black text-slate-900 dark:text-white block">
                      {studentCount}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Enrolled Students</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-midnight-800 border border-slate-200/80 dark:border-white/5">
                    <span className="text-lg font-black text-slate-900 dark:text-white block">
                      {facultyCount}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Faculty Staff</span>
                  </div>
                </div>
              );
            })()}

            {/* Curriculum List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  Curriculum Modules ({subjects.filter((s) => s.department_id === selectedDeptForDetails.id).length})
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => {
                    const deptId = selectedDeptForDetails.id;
                    setSelectedDeptForDetails(null);
                    handleOpenCreateSubject(deptId);
                  }}
                >
                  Add Subject
                </Button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {subjects
                  .filter((s) => s.department_id === selectedDeptForDetails.id)
                  .map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-midnight-800/80 border border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 px-2 py-1 rounded bg-blue-500/10">
                          {sub.code}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{sub.name}</p>
                          <p className="text-[10px] text-slate-400">
                            Semester {sub.semester} • {sub.credits} Credits • {sub.type}
                            {sub.is_elective && ' • Elective'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setSelectedDeptForDetails(null);
                            handleOpenEditSubject(sub);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                {subjects.filter((s) => s.department_id === selectedDeptForDetails.id).length === 0 && (
                  <div className="p-8 rounded-xl bg-slate-50 dark:bg-midnight-800 text-center text-slate-400 text-xs">
                    No curriculum subjects registered under this department yet.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200/80 dark:border-white/10">
              <Button variant="ghost" onClick={() => setSelectedDeptForDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Create / Edit Department Modal ── */}
      {showDeptModal && (
        <Modal
          isOpen={showDeptModal}
          onClose={() => setShowDeptModal(false)}
          title={editingItem ? 'Edit Department' : 'Create New Department'}
          description="Institutional departments organize subjects, faculties, and enrolled student cohorts."
          size="md"
        >
          <form onSubmit={handleSaveDepartment} className="space-y-4">
            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Department Code <span className="text-rose-500">*</span>
                </label>
                <input
                  placeholder="e.g. CSE, ITDS, ECE, MECH"
                  className="w-full border rounded-xl p-2.5 bg-white dark:bg-midnight-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Department Name <span className="text-rose-500">*</span>
                </label>
                <input
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full border rounded-xl p-2.5 bg-white dark:bg-midnight-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Head of Department (HOD)
                </label>
                <div className="relative">
                  <select
                    className="w-full border rounded-xl p-2.5 pr-9 bg-white dark:bg-midnight-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
                    value={deptForm.hod_id}
                    onChange={(e) => setDeptForm({ ...deptForm, hod_id: e.target.value })}
                  >
                    <option value="" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100">
                      -- Unassigned / To Be Appointed --
                    </option>
                    {facultyUsers.map((u) => (
                      <option
                        key={u.id}
                        value={u.id}
                        className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100"
                      >
                        {u.first_name || 'Faculty'} {u.last_name || ''} ({u.email}) - [{u.role}]
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Faculty or administrative staff appointed to oversee this department.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Scope & Description
                </label>
                <textarea
                  placeholder="Brief description of department scope, labs, research focus, and academic objectives..."
                  rows={3}
                  className="w-full border rounded-xl p-2.5 bg-white dark:bg-midnight-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
              <Button type="button" variant="ghost" onClick={() => setShowDeptModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Department'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Create / Edit Subject Modal ── */}
      {showSubjectModal && (
        <Modal
          isOpen={showSubjectModal}
          onClose={() => setShowSubjectModal(false)}
          title={editingItem ? 'Edit Subject Module' : 'New Subject Module'}
          description="Register syllabus courses and credit weightage under an academic department."
          size="md"
        >
          <form onSubmit={handleSaveSubject} className="space-y-4">
            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Subject Code <span className="text-rose-500">*</span>
                </label>
                <input
                  placeholder="e.g. CS201, IT402, MATH101"
                  className="w-full border rounded-xl p-2.5 bg-white dark:bg-midnight-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Subject Title <span className="text-rose-500">*</span>
                </label>
                <input
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full border rounded-xl p-2.5 bg-white dark:bg-midnight-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    className="w-full border rounded-xl p-2.5 pr-9 bg-white dark:bg-midnight-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
                    value={subjectForm.department_id}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, department_id: Number(e.target.value) })
                    }
                  >
                    {departments.map((d) => (
                      <option
                        key={d.id}
                        value={d.id}
                        className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100"
                      >
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Semester</label>
                  <div className="relative">
                    <select
                      className="w-full border rounded-xl p-2.5 pr-7 bg-white dark:bg-midnight-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
                      value={subjectForm.semester}
                      onChange={(e) =>
                        setSubjectForm({ ...subjectForm, semester: Number(e.target.value) })
                      }
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option
                          key={s}
                          value={s}
                          className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100"
                        >
                          Sem {s}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Credits</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="8"
                    className="w-full border rounded-xl p-2.5 bg-white dark:bg-midnight-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={subjectForm.credits}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Type</label>
                  <div className="relative">
                    <select
                      className="w-full border rounded-xl p-2.5 pr-7 bg-white dark:bg-midnight-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
                      value={subjectForm.type}
                      onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })}
                    >
                      <option
                        value="THEORY"
                        className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100"
                      >
                        Theory
                      </option>
                      <option
                        value="PRACTICAL"
                        className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100"
                      >
                        Practical
                      </option>
                      <option
                        value="ELECTIVE"
                        className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100"
                      >
                        Elective
                      </option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={subjectForm.is_elective}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, is_elective: e.target.checked })
                    }
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-white/10 dark:bg-midnight-900"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    This is an open/departmental elective subject
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
              <Button type="button" variant="ghost" onClick={() => setShowSubjectModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Subject'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <Modal
          isOpen={Boolean(deleteConfirm)}
          onClose={() => setDeleteConfirm(null)}
          title={`Confirm Removal of ${deleteConfirm.type === 'department' ? 'Department' : 'Subject'}`}
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Permanent Action</p>
                <p className="mt-1">
                  Are you sure you want to remove <strong className="font-semibold text-slate-900 dark:text-white">{deleteConfirm.name}</strong>?
                </p>
                {deleteConfirm.type === 'department' && (deleteConfirm.count || 0) > 0 && (
                  <p className="mt-2 text-rose-600 dark:text-rose-300 font-semibold">
                    Warning: This department currently has {deleteConfirm.count} linked subject modules.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleExecuteDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Removing...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
