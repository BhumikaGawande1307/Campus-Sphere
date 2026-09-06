import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import {
  Users,
  GraduationCap,
  Briefcase,
  Edit2,
  Search,
  Plus,
  Trash2,
  Upload,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  ArrowUpDown,
  SlidersHorizontal,
  Sparkles,
  ChevronDown,
  Eye,
  RefreshCw,
  Building2,
  Award,
  BookOpen,
  Layers,
  ExternalLink,
  ShieldCheck,
  Check,
  RotateCcw,
  LayoutGrid,
  List,
  Mail,
  UserCheck,
  UserX,
  Star,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/Badge';

interface DepartmentItem {
  id: number;
  name: string;
  code: string;
}

interface StudentUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  phone_number?: string;
  avatar_url?: string;
  role?: string;
}

interface StudentRecord {
  id: number;
  user_id: string;
  student_id: string;
  department_id: number | null;
  course: string | null;
  year: number | null;
  semester: number | null;
  division: string | null;
  cgpa: number | null;
  points: number | null;
  engagement_score?: number | null;
  placement_readiness_score?: number | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  portfolio_slug?: string | null;
  is_portfolio_public?: boolean;
  users?: StudentUser;
  departments?: DepartmentItem | null;
}

interface FacultyRecord {
  id: number;
  user_id: string;
  faculty_id: string;
  department_id: number | null;
  designation: string;
  office_room?: string | null;
  specialization?: string | null;
  joining_date?: string | null;
  users?: StudentUser;
  departments?: DepartmentItem | null;
}

interface ParsedStudentRow {
  rowNum: number;
  first_name: string;
  last_name: string;
  email: string;
  student_id: string;
  dept_code: string;
  matched_dept_id: number | null;
  course: string;
  year: number;
  semester: number;
  division: string;
  cgpa: number;
  points: number;
  isValid: boolean;
  validationIssues: string[];
}

export const UserManagement: React.FC = () => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'students' | 'faculty'>(
    window.location.pathname.includes('faculty') ? 'faculty' : 'students'
  );

  // View Mode: Table vs Grid Cards (Mobile defaults to cards)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'table'
  );

  // Core Data
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [faculty, setFaculty] = useState<FacultyRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [candidateUsers, setCandidateUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Common Search & Status
  const [searchQuery, setSearchQuery] = useState('');

  // Student Filters & Sorting
  const [studentDeptFilter, setStudentDeptFilter] = useState<string>('ALL');
  const [studentSemesterFilter, setStudentSemesterFilter] = useState<string>('ALL');
  const [studentYearFilter, setStudentYearFilter] = useState<string>('ALL');
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>('ALL');
  const [studentSortOption, setStudentSortOption] = useState<string>('id_asc');
  const [studentPage, setStudentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Faculty Filters & Sorting
  const [facultyDeptFilter, setFacultyDeptFilter] = useState<string>('ALL');
  const [facultyDesignationFilter, setFacultyDesignationFilter] = useState<string>('ALL');
  const [facultyStatusFilter, setFacultyStatusFilter] = useState<string>('ALL');
  const [facultySortOption, setFacultySortOption] = useState<string>('id_asc');
  const [facultyPage, setFacultyPage] = useState(1);

  // Modals
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  // Faculty Form
  const [facultyForm, setFacultyForm] = useState({
    user_id: '',
    faculty_id: '',
    department_id: 1,
    designation: 'Assistant Professor',
    specialization: 'Computer Science & Engineering',
    office_room: 'Block B-301',
  });
  const [isSubmittingFaculty, setIsSubmittingFaculty] = useState(false);

  // Student Edit Form
  const [studentEditForm, setStudentEditForm] = useState({
    department_id: 1,
    course: 'B.Tech in Computer Science',
    year: 1,
    semester: 1,
    division: 'A',
    cgpa: 0,
    points: 100,
    engagement_score: 50,
    placement_readiness_score: 50,
  });
  const [isSavingStudent, setIsSavingStudent] = useState(false);

  // Bulk Import Engine States
  const [bulkMode, setBulkMode] = useState<'upload' | 'paste'>('upload');
  const [csvContent, setCsvContent] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [bulkStep, setBulkStep] = useState<'input' | 'preview' | 'importing' | 'summary'>('input');
  const [defaultPassword, setDefaultPassword] = useState('Campus@2026');
  const [autoGenerateId, setAutoGenerateId] = useState(true);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, currentEmail: '' });
  const [importSummary, setImportSummary] = useState<{
    successful: number;
    updated: number;
    failed: number;
    errors: { row: number; email: string; reason: string }[];
  }>({ successful: 0, updated: 0, failed: 0, errors: [] });

  // Sync tab with URL if user navigates
  useEffect(() => {
    const isFac = window.location.pathname.includes('faculty');
    setActiveTab(isFac ? 'faculty' : 'students');
  }, [window.location.pathname]);

  // Fetch All Core Data
  const fetchData = async () => {
    try {
      // 1. Fetch Students with joined Users and Departments
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          users (id, first_name, last_name, email, is_active, phone_number, avatar_url, role),
          departments (id, name, code)
        `)
        .order('id', { ascending: true });

      if (studentError) throw studentError;
      setStudents(studentData || []);

      // 2. Fetch Faculty with joined Users and Departments
      const { data: facultyData, error: facultyError } = await supabase
        .from('faculty')
        .select(`
          *,
          users (id, first_name, last_name, email, is_active, phone_number, avatar_url, role),
          departments (id, name, code)
        `)
        .order('id', { ascending: true });

      if (facultyError) throw facultyError;
      setFaculty(facultyData || []);

      // 3. Fetch Departments
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('id, name, code')
        .order('name');

      if (deptError) throw deptError;
      setDepartments(deptData || []);

      // 4. Fetch Candidate Users for faculty assignment
      const { data: usersData } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role, is_active')
        .order('first_name')
        .limit(500);

      setCandidateUsers(usersData || []);
    } catch (err: any) {
      toast.error('Failed to load roster', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  // Reset pagination when filters change
  useEffect(() => {
    setStudentPage(1);
  }, [searchQuery, studentDeptFilter, studentSemesterFilter, studentYearFilter, studentStatusFilter, studentSortOption]);

  useEffect(() => {
    setFacultyPage(1);
  }, [searchQuery, facultyDeptFilter, facultyDesignationFilter, facultyStatusFilter, facultySortOption]);

  // Quick stats calculation
  const stats = useMemo(() => {
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.users?.is_active !== false).length;
    const suspendedStudents = totalStudents - activeStudents;
    const totalFaculty = faculty.length;
    const activeFaculty = faculty.filter(f => f.users?.is_active !== false).length;
    const activeDepts = departments.length;
    const avgCgpa = totalStudents > 0
      ? (students.reduce((acc, s) => acc + (Number(s.cgpa) || 0), 0) / totalStudents).toFixed(2)
      : '0.00';

    return {
      totalStudents,
      activeStudents,
      suspendedStudents,
      totalFaculty,
      activeFaculty,
      activeDepts,
      avgCgpa,
    };
  }, [students, faculty, departments]);

  // Filter & Sort Students
  const filteredStudents = useMemo(() => {
    let result = [...students];

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => {
        const fullName = `${s.users?.first_name || ''} ${s.users?.last_name || ''}`.toLowerCase();
        const email = (s.users?.email || '').toLowerCase();
        const studentId = (s.student_id || '').toLowerCase();
        const course = (s.course || '').toLowerCase();
        const deptCode = (s.departments?.code || '').toLowerCase();
        const deptName = (s.departments?.name || '').toLowerCase();

        return (
          fullName.includes(q) ||
          email.includes(q) ||
          studentId.includes(q) ||
          course.includes(q) ||
          deptCode.includes(q) ||
          deptName.includes(q)
        );
      });
    }

    // Department Filter
    if (studentDeptFilter !== 'ALL') {
      const deptIdNum = Number(studentDeptFilter);
      result = result.filter(s => s.department_id === deptIdNum);
    }

    // Semester Filter
    if (studentSemesterFilter !== 'ALL') {
      const semNum = Number(studentSemesterFilter);
      result = result.filter(s => s.semester === semNum);
    }

    // Year Filter
    if (studentYearFilter !== 'ALL') {
      const yrNum = Number(studentYearFilter);
      result = result.filter(s => s.year === yrNum);
    }

    // Status Filter
    if (studentStatusFilter !== 'ALL') {
      const isAct = studentStatusFilter === 'ACTIVE';
      result = result.filter(s => (s.users?.is_active ?? true) === isAct);
    }

    // Sorting
    result.sort((a, b) => {
      switch (studentSortOption) {
        case 'name_asc': {
          const nameA = `${a.users?.first_name || ''} ${a.users?.last_name || ''}`.toLowerCase();
          const nameB = `${b.users?.first_name || ''} ${b.users?.last_name || ''}`.toLowerCase();
          return nameA.localeCompare(nameB);
        }
        case 'name_desc': {
          const nameA = `${a.users?.first_name || ''} ${a.users?.last_name || ''}`.toLowerCase();
          const nameB = `${b.users?.first_name || ''} ${b.users?.last_name || ''}`.toLowerCase();
          return nameB.localeCompare(nameA);
        }
        case 'id_asc':
          return (a.student_id || '').localeCompare(b.student_id || '', undefined, { numeric: true });
        case 'id_desc':
          return (b.student_id || '').localeCompare(a.student_id || '', undefined, { numeric: true });
        case 'cgpa_desc':
          return (Number(b.cgpa) || 0) - (Number(a.cgpa) || 0);
        case 'cgpa_asc':
          return (Number(a.cgpa) || 0) - (Number(b.cgpa) || 0);
        case 'points_desc':
          return (Number(b.points) || 0) - (Number(a.points) || 0);
        case 'points_asc':
          return (Number(a.points) || 0) - (Number(b.points) || 0);
        case 'semester_asc':
          return (Number(a.semester) || 0) - (Number(b.semester) || 0);
        case 'semester_desc':
          return (Number(b.semester) || 0) - (Number(a.semester) || 0);
        case 'year_asc':
          return (Number(a.year) || 0) - (Number(b.year) || 0);
        case 'year_desc':
          return (Number(b.year) || 0) - (Number(a.year) || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [
    students,
    searchQuery,
    studentDeptFilter,
    studentSemesterFilter,
    studentYearFilter,
    studentStatusFilter,
    studentSortOption,
  ]);

  // Paginated Students
  const paginatedStudents = useMemo(() => {
    const start = (studentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, studentPage]);

  // Filter & Sort Faculty
  const filteredFaculty = useMemo(() => {
    let result = [...faculty];

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f => {
        const fullName = `${f.users?.first_name || ''} ${f.users?.last_name || ''}`.toLowerCase();
        const email = (f.users?.email || '').toLowerCase();
        const facultyId = (f.faculty_id || '').toLowerCase();
        const specialization = (f.specialization || '').toLowerCase();
        const room = (f.office_room || '').toLowerCase();
        const deptName = (f.departments?.name || '').toLowerCase();

        return (
          fullName.includes(q) ||
          email.includes(q) ||
          facultyId.includes(q) ||
          specialization.includes(q) ||
          room.includes(q) ||
          deptName.includes(q)
        );
      });
    }

    // Department Filter
    if (facultyDeptFilter !== 'ALL') {
      const deptIdNum = Number(facultyDeptFilter);
      result = result.filter(f => f.department_id === deptIdNum);
    }

    // Designation Filter
    if (facultyDesignationFilter !== 'ALL') {
      result = result.filter(f => f.designation.toLowerCase() === facultyDesignationFilter.toLowerCase());
    }

    // Status Filter
    if (facultyStatusFilter !== 'ALL') {
      const isAct = facultyStatusFilter === 'ACTIVE';
      result = result.filter(f => (f.users?.is_active ?? true) === isAct);
    }

    // Sorting
    result.sort((a, b) => {
      switch (facultySortOption) {
        case 'name_asc': {
          const nameA = `${a.users?.first_name || ''} ${a.users?.last_name || ''}`.toLowerCase();
          const nameB = `${b.users?.first_name || ''} ${b.users?.last_name || ''}`.toLowerCase();
          return nameA.localeCompare(nameB);
        }
        case 'name_desc': {
          const nameA = `${a.users?.first_name || ''} ${a.users?.last_name || ''}`.toLowerCase();
          const nameB = `${b.users?.first_name || ''} ${b.users?.last_name || ''}`.toLowerCase();
          return nameB.localeCompare(nameA);
        }
        case 'id_asc':
          return (a.faculty_id || '').localeCompare(b.faculty_id || '', undefined, { numeric: true });
        case 'id_desc':
          return (b.faculty_id || '').localeCompare(a.faculty_id || '', undefined, { numeric: true });
        case 'designation':
          return a.designation.localeCompare(b.designation);
        case 'department':
          return (a.departments?.name || '').localeCompare(b.departments?.name || '');
        default:
          return 0;
      }
    });

    return result;
  }, [
    faculty,
    searchQuery,
    facultyDeptFilter,
    facultyDesignationFilter,
    facultyStatusFilter,
    facultySortOption,
  ]);

  // Paginated Faculty
  const paginatedFaculty = useMemo(() => {
    const start = (facultyPage - 1) * ITEMS_PER_PAGE;
    return filteredFaculty.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFaculty, facultyPage]);

  // Toggle user active/suspended status
  const toggleUserStatus = async (userId: string, currentStatus: boolean | undefined) => {
    try {
      const isCurrentlyActive = currentStatus ?? true;
      const { error } = await supabase.rpc('toggle_user_status', {
        target_user_id: userId,
        new_status: !isCurrentlyActive,
      });
      if (error) throw error;
      toast.success(
        !isCurrentlyActive ? 'Account Activated' : 'Account Suspended',
        `User status has been updated.`
      );
      fetchData();
    } catch (err: any) {
      toast.error('Failed to update status', err.message);
    }
  };

  // Open Edit Student Modal
  const handleOpenEditStudent = (student: StudentRecord) => {
    setSelectedStudent(student);
    setStudentEditForm({
      department_id: student.department_id || departments[0]?.id || 1,
      course: student.course || 'B.Tech in Computer Science',
      year: student.year || 1,
      semester: student.semester || 1,
      division: student.division || 'A',
      cgpa: Number(student.cgpa) || 0,
      points: Number(student.points) || 100,
      engagement_score: student.engagement_score ?? 50,
      placement_readiness_score: student.placement_readiness_score ?? 50,
    });
    setShowEditStudentModal(true);
  };

  // Save Student Edit Changes
  const handleSaveStudentEdit = async () => {
    if (!selectedStudent) return;
    setIsSavingStudent(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          department_id: Number(studentEditForm.department_id),
          course: studentEditForm.course.trim(),
          year: Number(studentEditForm.year),
          semester: Number(studentEditForm.semester),
          division: studentEditForm.division.trim().toUpperCase() || 'A',
          cgpa: Number(studentEditForm.cgpa),
          points: Number(studentEditForm.points),
          engagement_score: Number(studentEditForm.engagement_score),
          placement_readiness_score: Number(studentEditForm.placement_readiness_score),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedStudent.id);

      if (error) throw error;

      toast.success('Student Record Updated', `${selectedStudent.student_id} academic record saved.`);
      setShowEditStudentModal(false);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to update student', err.message);
    } finally {
      setIsSavingStudent(false);
    }
  };

  // Add / Assign Faculty Member
  const handleAddFaculty = async () => {
    if (!facultyForm.user_id || !facultyForm.faculty_id.trim()) {
      toast.error('Validation Error', 'Please select a user and provide a Faculty ID.');
      return;
    }
    setIsSubmittingFaculty(true);
    try {
      const { error: facError } = await supabase.from('faculty').upsert(
        {
          user_id: facultyForm.user_id,
          faculty_id: facultyForm.faculty_id.trim().toUpperCase(),
          department_id: Number(facultyForm.department_id) || departments[0]?.id || 1,
          designation: facultyForm.designation,
          specialization: facultyForm.specialization.trim(),
          office_room: facultyForm.office_room.trim(),
          joining_date: new Date().toISOString().split('T')[0],
        },
        { onConflict: 'user_id' }
      );

      if (facError) throw facError;

      // Update user role to FACULTY via RPC
      const { error: roleError } = await supabase.rpc('assign_user_role', {
        target_user_id: facultyForm.user_id,
        new_role: 'FACULTY',
      });
      if (roleError) throw roleError;

      toast.success('Faculty Assigned', 'Faculty member assigned and roster updated.');
      setShowAddFacultyModal(false);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to assign faculty', err.message);
    } finally {
      setIsSubmittingFaculty(false);
    }
  };

  // ==========================================
  // BULK STUDENT CSV IMPORT ENGINE
  // ==========================================

  // 1. Download Sample CSV Template
  const handleDownloadSampleCsv = () => {
    const defaultCodes = departments.length > 0 ? departments.map(d => d.code).join(' / ') : 'CSE / ITDS / ECE / MECH / CIVIL / BCA';
    const sampleHeaders = 'First Name,Last Name,Email,Student ID,Department Code,Course,Year,Semester,Division,CGPA,Points\n';
    const sampleRows = [
      `Aarav,Sharma,aarav.sharma@campus.edu,CS2026101,${departments[0]?.code || 'CSE'},B.Tech in Computer Science,1,1,A,8.85,100`,
      `Priya,Patel,priya.patel@campus.edu,IT2026102,${departments[1]?.code || 'ITDS'},B.Tech in Information Technology,2,3,B,9.10,120`,
      `Rohan,Verma,rohan.verma@campus.edu,EC2026103,${departments[2]?.code || 'ECE'},B.Tech in Electronics & Comm,3,5,A,7.90,95`,
      `Ananya,Deshmukh,ananya.deshmukh@campus.edu,BCA2026104,${departments[5]?.code || 'BCA'},Bachelor of Computer Applications,1,2,A,8.40,110`,
      `Vikram,Singh,vikram.singh@campus.edu,ME2026105,${departments[3]?.code || 'MECH'},B.Tech in Mechanical Engineering,4,7,A,8.20,130`,
    ].join('\n');

    const fullCsv = sampleHeaders + sampleRows;
    const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'campus_students_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Template Downloaded', `Sample CSV created with valid department codes (${defaultCodes})`);
  };

  // 2. Parse CSV Text into Structured & Validated Rows
  const parseCsvText = (rawText: string) => {
    if (!rawText.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = rawText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length < 2) {
      toast.warning('Invalid CSV', 'Please provide a header row and at least one student data row.');
      return;
    }

    // Parse header row
    const rawHeaders = lines[0].split(/,|;/).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    
    // Header index finder
    const getIndex = (aliases: string[]) => {
      return rawHeaders.findIndex(h => aliases.some(alias => h === alias || h.replace(/[\s_-]/g, '') === alias.replace(/[\s_-]/g, '')));
    };

    const idxFirstName = getIndex(['first_name', 'firstname', 'first name', 'first', 'name']);
    const idxLastName = getIndex(['last_name', 'lastname', 'last name', 'last', 'surname']);
    const idxEmail = getIndex(['email', 'mail', 'student_email', 'email_address']);
    const idxStudentId = getIndex(['student_id', 'id', 'roll_no', 'rollno', 'roll no', 'prn', 'enrollment_no']);
    const idxDeptCode = getIndex(['department_code', 'department', 'dept_code', 'dept', 'branch']);
    const idxCourse = getIndex(['course', 'program', 'degree', 'branch_name']);
    const idxYear = getIndex(['year', 'study_year', 'academic_year']);
    const idxSem = getIndex(['semester', 'sem']);
    const idxDiv = getIndex(['division', 'div', 'section', 'sec']);
    const idxCgpa = getIndex(['cgpa', 'gpa', 'score']);
    const idxPoints = getIndex(['points', 'credits', 'reward_points']);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const parsed: ParsedStudentRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Handle quoted commas safely
      const cols: string[] = [];
      let currentVal = '';
      let inQuotes = false;

      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if ((char === ',' || char === ';') && !inQuotes) {
          cols.push(currentVal.trim().replace(/^["']|["']$/g, ''));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      cols.push(currentVal.trim().replace(/^["']|["']$/g, ''));

      const firstName = idxFirstName !== -1 ? cols[idxFirstName] || '' : cols[0] || '';
      const lastName = idxLastName !== -1 ? cols[idxLastName] || '' : cols[1] || '';
      const email = idxEmail !== -1 ? cols[idxEmail] || '' : cols[2] || '';
      let studentId = idxStudentId !== -1 ? cols[idxStudentId] || '' : cols[3] || '';
      const deptCode = idxDeptCode !== -1 ? (cols[idxDeptCode] || '').toUpperCase() : '';
      const course = idxCourse !== -1 ? cols[idxCourse] || 'B.Tech in Computer Science' : 'B.Tech in Computer Science';
      const year = idxYear !== -1 ? Math.max(1, Math.min(4, Number(cols[idxYear]) || 1)) : 1;
      const sem = idxSem !== -1 ? Math.max(1, Math.min(8, Number(cols[idxSem]) || 1)) : 1;
      const division = idxDiv !== -1 ? (cols[idxDiv] || 'A').toUpperCase() : 'A';
      const cgpa = idxCgpa !== -1 ? Math.max(0, Math.min(10, Number(cols[idxCgpa]) || 0)) : 0;
      const points = idxPoints !== -1 ? Number(cols[idxPoints]) || 100 : 100;

      // Department matching
      let matchedDept = departments.find(d => d.code.toUpperCase() === deptCode.toUpperCase());
      if (!matchedDept && deptCode) {
        matchedDept = departments.find(d => d.name.toLowerCase().includes(deptCode.toLowerCase()));
      }
      const matchedDeptId = matchedDept ? matchedDept.id : (departments[0]?.id || 1);

      // Auto-generate student ID if missing and setting enabled
      if (!studentId && autoGenerateId) {
        studentId = `CS2026${Math.floor(1000 + Math.random() * 9000)}`;
      }

      // Validation
      const issues: string[] = [];
      if (!firstName.trim()) issues.push('First name is required');
      if (!email.trim()) issues.push('Email is required');
      else if (!emailRegex.test(email)) issues.push('Invalid email format');
      if (!studentId.trim()) issues.push('Student ID is required');
      if (deptCode && !matchedDept) issues.push(`Department code "${deptCode}" not recognized; defaulting to ${departments[0]?.name || 'CSE'}`);

      parsed.push({
        rowNum: i,
        first_name: firstName,
        last_name: lastName,
        email: email.trim().toLowerCase(),
        student_id: studentId.trim().toUpperCase(),
        dept_code: deptCode || (departments[0]?.code || 'CSE'),
        matched_dept_id: matchedDeptId,
        course: course || 'B.Tech in Computer Science',
        year,
        semester: sem,
        division: division || 'A',
        cgpa,
        points,
        isValid: issues.filter(iss => !iss.includes('defaulting to')).length === 0,
        validationIssues: issues,
      });
    }

    setParsedRows(parsed);
    setBulkStep('preview');
  };

  // 3. Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      toast.error('Invalid File', 'Please select a .csv or .txt file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      parseCsvText(content);
    };
    reader.readAsText(file);
  };

  // 4. Execute Live Bulk Import
  const handleExecuteBulkImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error('No Valid Rows', 'There are no valid student records to import.');
      return;
    }

    setBulkStep('importing');
    setImportProgress({ current: 0, total: validRows.length, currentEmail: '' });

    // Isolated Supabase client to safeguard current administrator session
    const isolatedClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    let successCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errorsList: { row: number; email: string; reason: string }[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setImportProgress({
        current: i + 1,
        total: validRows.length,
        currentEmail: row.email,
      });

      try {
        // Step A: Check if a user with this email already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, email, first_name, last_name')
          .eq('email', row.email)
          .maybeSingle();

        let effectiveUserId = existingUser?.id;

        if (effectiveUserId) {
          // User already exists in public.users: Update profile names & upsert student record
          await supabase
            .from('users')
            .update({
              first_name: row.first_name || existingUser.first_name,
              last_name: row.last_name || existingUser.last_name,
              role: 'STUDENT',
            })
            .eq('id', effectiveUserId);

          const { error: studentUpsertErr } = await supabase
            .from('students')
            .upsert(
              {
                user_id: effectiveUserId,
                student_id: row.student_id,
                department_id: row.matched_dept_id,
                course: row.course,
                year: row.year,
                semester: row.semester,
                division: row.division,
                cgpa: row.cgpa,
                points: row.points,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );

          if (studentUpsertErr) throw studentUpsertErr;
          updatedCount++;
        } else {
          // New User: Call isolatedClient.auth.signUp with full user metadata
          const { data: authData, error: authError } = await isolatedClient.auth.signUp({
            email: row.email,
            password: defaultPassword || 'Campus@2026',
            options: {
              data: {
                first_name: row.first_name,
                last_name: row.last_name,
                username: row.email.split('@')[0],
                role: 'STUDENT',
                student_id: row.student_id,
                department_id: row.matched_dept_id,
                course: row.course,
                year: row.year,
                semester: row.semester,
                division: row.division,
                cgpa: row.cgpa,
              },
            },
          });

          if (authError) {
            // If already registered in auth or another issue, report exact message
            throw authError;
          }

          if (authData?.user?.id) {
            effectiveUserId = authData.user.id;

            // Ensure student record has accurate data in public.students table
            await supabase
              .from('students')
              .upsert(
                {
                  user_id: effectiveUserId,
                  student_id: row.student_id,
                  department_id: row.matched_dept_id,
                  course: row.course,
                  year: row.year,
                  semester: row.semester,
                  division: row.division,
                  cgpa: row.cgpa,
                  points: row.points,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' }
              );

            successCount++;
          } else {
            throw new Error('User creation returned empty ID.');
          }
        }
      } catch (err: any) {
        errorCount++;
        errorsList.push({
          row: row.rowNum,
          email: row.email,
          reason: err.message || 'Unknown database error',
        });
      }

      // Small throttle to avoid hitting harsh rate limits
      await new Promise(r => setTimeout(r, 120));
    }

    setImportSummary({
      successful: successCount,
      updated: updatedCount,
      failed: errorCount,
      errors: errorsList,
    });

    setBulkStep('summary');
    fetchData(); // Refresh directory immediately
  };

  // Reset Bulk Modal
  const handleCloseBulkModal = () => {
    setShowBulkImportModal(false);
    setBulkStep('input');
    setCsvContent('');
    setParsedRows([]);
    setImportSummary({ successful: 0, updated: 0, failed: 0, errors: [] });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Reset Student Filters
  const handleResetStudentFilters = () => {
    setSearchQuery('');
    setStudentDeptFilter('ALL');
    setStudentSemesterFilter('ALL');
    setStudentYearFilter('ALL');
    setStudentStatusFilter('ALL');
    setStudentSortOption('id_asc');
  };

  // Reset Faculty Filters
  const handleResetFacultyFilters = () => {
    setSearchQuery('');
    setFacultyDeptFilter('ALL');
    setFacultyDesignationFilter('ALL');
    setFacultyStatusFilter('ALL');
    setFacultySortOption('id_asc');
  };

  const isStudentFilterActive =
    searchQuery !== '' ||
    studentDeptFilter !== 'ALL' ||
    studentSemesterFilter !== 'ALL' ||
    studentYearFilter !== 'ALL' ||
    studentStatusFilter !== 'ALL' ||
    studentSortOption !== 'id_asc';

  const isFacultyFilterActive =
    searchQuery !== '' ||
    facultyDeptFilter !== 'ALL' ||
    facultyDesignationFilter !== 'ALL' ||
    facultyStatusFilter !== 'ALL' ||
    facultySortOption !== 'id_asc';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-900 dark:text-slate-100">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-midnight-900 p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              College Administration
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Verified Access
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Academic Roster & Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Filter, sort, and manage students, faculty, departmental affiliations, and bulk enrollments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            leftIcon={<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}
            className="rounded-xl"
          >
            Refresh
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
            onClick={() => {
              setBulkStep('input');
              setShowBulkImportModal(true);
            }}
            className="rounded-xl font-semibold border-slate-200 dark:border-white/10"
          >
            Bulk Import
          </Button>

          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              if (candidateUsers.length > 0) {
                setFacultyForm(prev => ({
                  ...prev,
                  user_id: candidateUsers[0]?.id || '',
                  department_id: departments[0]?.id || 1,
                }));
              }
              setShowAddFacultyModal(true);
            }}
            className="rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
          >
            Assign Faculty
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Students */}
        <div className="bg-white dark:bg-midnight-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Students
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.totalStudents}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {stats.activeStudents} active
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{
                width: `${stats.totalStudents > 0 ? (stats.activeStudents / stats.totalStudents) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Faculty & Staff */}
        <div className="bg-white dark:bg-midnight-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Faculty & Staff
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.totalFaculty}
            </span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {stats.activeFaculty} on roster
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{
                width: `${stats.totalFaculty > 0 ? (stats.activeFaculty / stats.totalFaculty) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Active Departments */}
        <div className="bg-white dark:bg-midnight-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Departments
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.activeDepts}
            </span>
            <span className="text-xs text-slate-500">active programs</span>
          </div>
          <p className="text-xs text-slate-500 truncate">
            {departments.map(d => d.code).join(', ')}
          </p>
        </div>

        {/* Cohort Average Performance */}
        <div className="bg-white dark:bg-midnight-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Avg CGPA
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.avgCgpa}
            </span>
            <span className="text-xs text-slate-500">out of 10.0</span>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
            <Sparkles className="h-3 w-3" />
            Institution Academic Health
          </p>
        </div>
      </div>

      {/* Primary Tab Navigation & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'students'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Students Roster</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === 'students'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-midnight-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {filteredStudents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('faculty')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'faculty'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Faculty & Staff</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === 'faculty'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-midnight-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {filteredFaculty.length}
            </span>
          </button>
        </div>

        {/* View Switcher: Table vs Cards */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-midnight-800 rounded-xl border border-slate-200/80 dark:border-white/5">
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-midnight-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Card Grid View"
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-midnight-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white dark:bg-midnight-900 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'students'
                  ? 'Search student name, ID, email, or course...'
                  : 'Search faculty name, ID, email, or specialization...'
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Tab Specific Filter Selects */}
          {activeTab === 'students' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex items-center gap-2">
              {/* Department */}
              <div className="relative min-w-[130px]">
                <select
                  value={studentDeptFilter}
                  onChange={e => setStudentDeptFilter(e.target.value)}
                  className="w-full py-2 pl-3 pr-8 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-950 text-slate-900 dark:text-white appearance-none focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="ALL" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">
                    All Departments
                  </option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id} className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Semester */}
              <div className="relative min-w-[110px]">
                <select
                  value={studentSemesterFilter}
                  onChange={e => setStudentSemesterFilter(e.target.value)}
                  className="w-full py-2 pl-3 pr-8 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-950 text-slate-900 dark:text-white appearance-none focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="ALL" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">
                    All Semesters
                  </option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem} className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">
                      Semester {sem}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Year */}
              <div className="relative min-w-[95px]">
                <select
                  value={studentYearFilter}
                  onChange={e => setStudentYearFilter(e.target.value)}
                  className="w-full py-2 pl-3 pr-8 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-950 text-slate-900 dark:text-white appearance-none focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="ALL" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">
                    All Years
                  </option>
                  <option value="1" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Year 1</option>
                  <option value="2" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Year 2</option>
                  <option value="3" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Year 3</option>
                  <option value="4" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Year 4</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Status */}
              <div className="relative min-w-[100px]">
                <select
                  value={studentStatusFilter}
                  onChange={e => setStudentStatusFilter(e.target.value)}
                  className="w-full py-2 pl-3 pr-8 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-950 text-slate-900 dark:text-white appearance-none focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="ALL" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">All Status</option>
                  <option value="ACTIVE" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Active Only</option>
                  <option value="SUSPENDED" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Suspended</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Sort Selector */}
              <div className="relative min-w-[140px] col-span-2 sm:col-span-1">
                <select
                  value={studentSortOption}
                  onChange={e => setStudentSortOption(e.target.value)}
                  className="w-full py-2 pl-3 pr-8 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-950 text-slate-900 dark:text-white appearance-none focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="id_asc" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Sort: ID (Asc)</option>
                  <option value="id_desc" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Sort: ID (Desc)</option>
                  <option value="name_asc" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Name (A → Z)</option>
                  <option value="name_desc" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Name (Z → A)</option>
                  <option value="cgpa_desc" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">CGPA (Highest)</option>
                  <option value="cgpa_asc" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">CGPA (Lowest)</option>
                  <option value="points_desc" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Points (Highest)</option>
                  <option value="semester_asc" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Semester (Asc)</option>
                  <option value="year_asc" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Year (Asc)</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex items-center gap-2">
              {/* Faculty Department */}
              <div className="relative min-w-[130px]">
                <select
                  value={facultyDeptFilter}
                  onChange={e => setFacultyDeptFilter(e.target.value)}
                  className="w-full py-2 pl-3 pr-8 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-950 text-slate-900 dark:text-white appearance-none focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="ALL" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">
                    All Departments
                  </option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id} className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Designation */}
              <div className="relative min-w-[130px]">
                <select
                  value={facultyDesignationFilter}
                  onChange={e => setFacultyDesignationFilter(e.target.value)}
                  className="w-full py-2 pl-3 pr-8 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-950 text-slate-900 dark:text-white appearance-none focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="ALL" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">
                    All Designations
                  </option>
                  <option value="Professor" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Professor</option>
                  <option value="Associate Professor" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Associate Professor</option>
                  <option value="Assistant Professor" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Assistant Professor</option>
                  <option value="HOD" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">HOD</option>
                  <option value="Lecturer" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100">Lecturer</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Faculty Status */}
              <div className="relative min-w-[100px]">
                <select
                  value={facultyStatusFilter}
                  onChange={e => setFacultyStatusFilter(e.target.value)}
                  className="w-full py-2 pl-3 pr-8 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-950 text-slate-900 dark:text-white appearance-none focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="ALL" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">All Status</option>
                  <option value="ACTIVE" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Active Only</option>
                  <option value="SUSPENDED" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Suspended</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Faculty Sort */}
              <div className="relative min-w-[140px] col-span-2 sm:col-span-1">
                <select
                  value={facultySortOption}
                  onChange={e => setFacultySortOption(e.target.value)}
                  className="w-full py-2 pl-3 pr-8 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-950 text-slate-900 dark:text-white appearance-none focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="id_asc" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Sort: ID (Asc)</option>
                  <option value="id_desc" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Sort: ID (Desc)</option>
                  <option value="name_asc" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Name (A → Z)</option>
                  <option value="name_desc" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Name (Z → A)</option>
                  <option value="designation" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Designation</option>
                  <option value="department" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Department</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Reset Filters Action */}
          {((activeTab === 'students' && isStudentFilterActive) ||
            (activeTab === 'faculty' && isFacultyFilterActive)) && (
            <button
              onClick={activeTab === 'students' ? handleResetStudentFilters : handleResetFacultyFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Active Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-white/5 text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Filter className="h-3 w-3" />
            Active:
          </span>

          {activeTab === 'students' ? (
            <>
              {studentDeptFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                  Dept: {departments.find(d => d.id === Number(studentDeptFilter))?.code || studentDeptFilter}
                  <button onClick={() => setStudentDeptFilter('ALL')}>
                    <X className="h-3 w-3 hover:text-blue-900" />
                  </button>
                </span>
              )}
              {studentSemesterFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium">
                  Sem: {studentSemesterFilter}
                  <button onClick={() => setStudentSemesterFilter('ALL')}>
                    <X className="h-3 w-3 hover:text-indigo-900" />
                  </button>
                </span>
              )}
              {studentYearFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">
                  Year: {studentYearFilter}
                  <button onClick={() => setStudentYearFilter('ALL')}>
                    <X className="h-3 w-3 hover:text-purple-900" />
                  </button>
                </span>
              )}
              {studentStatusFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
                  Status: {studentStatusFilter}
                  <button onClick={() => setStudentStatusFilter('ALL')}>
                    <X className="h-3 w-3 hover:text-amber-900" />
                  </button>
                </span>
              )}
              {!isStudentFilterActive && (
                <span className="text-slate-400 italic">Showing all enrolled students</span>
              )}
            </>
          ) : (
            <>
              {facultyDeptFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                  Dept: {departments.find(d => d.id === Number(facultyDeptFilter))?.code || facultyDeptFilter}
                  <button onClick={() => setFacultyDeptFilter('ALL')}>
                    <X className="h-3 w-3 hover:text-blue-900" />
                  </button>
                </span>
              )}
              {facultyDesignationFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium">
                  Designation: {facultyDesignationFilter}
                  <button onClick={() => setFacultyDesignationFilter('ALL')}>
                    <X className="h-3 w-3 hover:text-indigo-900" />
                  </button>
                </span>
              )}
              {facultyStatusFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
                  Status: {facultyStatusFilter}
                  <button onClick={() => setFacultyStatusFilter('ALL')}>
                    <X className="h-3 w-3 hover:text-amber-900" />
                  </button>
                </span>
              )}
              {!isFacultyFilterActive && (
                <span className="text-slate-400 italic">Showing all registered faculty & staff</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* CONTENT REGION: STUDENTS OR FACULTY */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-3 bg-white dark:bg-midnight-900 rounded-3xl border border-slate-200/80 dark:border-white/10">
          <RefreshCw className="h-7 w-7 animate-spin text-blue-600" />
          <p className="text-sm font-semibold">Loading institutional directory...</p>
        </div>
      ) : activeTab === 'students' ? (
        /* ================= STUDENTS SECTION ================= */
        <div className="space-y-4">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white dark:bg-midnight-900 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-3">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No students match current filters</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try adjusting your search terms, changing the department or semester selection, or reset all filters.
              </p>
              <Button size="sm" variant="secondary" onClick={handleResetStudentFilters} className="rounded-xl mt-2">
                Clear Filters
              </Button>
            </div>
          ) : viewMode === 'table' ? (
            /* Student Table View */
            <div className="bg-white dark:bg-midnight-900 rounded-3xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs">
              <div className="overflow-x-auto touch-pan-x">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-4 pl-6">Student ID</th>
                      <th className="p-4">Name & Email</th>
                      <th className="p-4">Department & Course</th>
                      <th className="p-4 text-center">Year / Sem</th>
                      <th className="p-4 text-center">CGPA</th>
                      <th className="p-4 text-center">Points</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {paginatedStudents.map(s => {
                      const isActive = s.users?.is_active ?? true;
                      const cgpaVal = Number(s.cgpa) || 0;
                      return (
                        <tr
                          key={s.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="p-4 pl-6">
                            <span className="font-mono font-bold text-xs sm:text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg">
                              {s.student_id}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                                {(s.users?.first_name?.[0] || 'S').toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate">
                                  {s.users?.first_name || 'Student'} {s.users?.last_name || ''}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {s.users?.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                                {s.departments?.code || 'GEN'}
                              </span>
                              <p className="text-xs text-slate-500 truncate max-w-[200px]">
                                {s.course || 'B.Tech Program'}
                              </p>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              Year {s.year || 1} • Sem {s.semester || 1}
                            </span>
                            <p className="text-[10px] text-slate-400">Div {s.division || 'A'}</p>
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                                cgpaVal >= 8.5
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                                  : cgpaVal >= 7.0
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40'
                                  : cgpaVal >= 6.0
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40'
                              }`}
                            >
                              {cgpaVal.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {s.points || 0}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <Badge variant={isActive ? 'success' : 'danger'} size="sm">
                              {isActive ? 'Active' : 'Suspended'}
                            </Badge>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditStudent(s)}
                                title="Edit Academic Profile"
                                className="h-8 w-8 p-0 rounded-lg text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleUserStatus(s.user_id, isActive)}
                                title={isActive ? 'Suspend student account' : 'Activate student account'}
                                className={`h-8 px-2.5 rounded-lg text-xs font-semibold ${
                                  isActive
                                    ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30'
                                    : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30'
                                }`}
                              >
                                {isActive ? 'Suspend' : 'Activate'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              <div className="p-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
                <span>
                  Showing {(studentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                  {Math.min(studentPage * ITEMS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length} students
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                    disabled={studentPage === 1}
                    className="rounded-xl text-xs"
                  >
                    Previous
                  </Button>
                  <span className="font-semibold text-slate-900 dark:text-white px-2">
                    Page {studentPage} of {Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE))}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setStudentPage(p => p + 1)}
                    disabled={studentPage * ITEMS_PER_PAGE >= filteredStudents.length}
                    className="rounded-xl text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Student Grid Cards View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedStudents.map(s => {
                const isActive = s.users?.is_active ?? true;
                const cgpaVal = Number(s.cgpa) || 0;
                return (
                  <div
                    key={s.id}
                    className="bg-white dark:bg-midnight-900 rounded-3xl border border-slate-200/80 dark:border-white/10 p-5 space-y-4 shadow-xs hover:border-blue-500/50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg">
                        {s.student_id}
                      </span>
                      <Badge variant={isActive ? 'success' : 'danger'} size="sm">
                        {isActive ? 'Active' : 'Suspended'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                        {(s.users?.first_name?.[0] || 'S').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">
                          {s.users?.first_name || 'Student'} {s.users?.last_name || ''}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {s.users?.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                          {s.departments?.name || 'Computer Science'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Level</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          Year {s.year || 1} • Sem {s.semester || 1}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">CGPA</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                          {cgpaVal.toFixed(2)} / 10.0
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Points</span>
                        <span className="font-bold text-amber-500 block flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400" />
                          {s.points || 0} pts
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEditStudent(s)}
                        leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                        className="flex-1 rounded-xl text-xs"
                      >
                        Edit Profile
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleUserStatus(s.user_id, isActive)}
                        className={`text-xs rounded-xl ${
                          isActive
                            ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400'
                        }`}
                      >
                        {isActive ? 'Suspend' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ================= FACULTY SECTION ================= */
        <div className="space-y-4">
          {filteredFaculty.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white dark:bg-midnight-900 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-3">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No faculty match current filters</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Adjust your designation or department filter to see faculty and staff members.
              </p>
              <Button size="sm" variant="secondary" onClick={handleResetFacultyFilters} className="rounded-xl mt-2">
                Clear Filters
              </Button>
            </div>
          ) : viewMode === 'table' ? (
            /* Faculty Table View */
            <div className="bg-white dark:bg-midnight-900 rounded-3xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs">
              <div className="overflow-x-auto touch-pan-x">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-4 pl-6">Faculty ID</th>
                      <th className="p-4">Name & Email</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Designation</th>
                      <th className="p-4">Office & Specialization</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {paginatedFaculty.map(f => {
                      const isActive = f.users?.is_active ?? true;
                      return (
                        <tr
                          key={f.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="p-4 pl-6">
                            <span className="font-mono font-bold text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg">
                              {f.faculty_id}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                                {(f.users?.first_name?.[0] || 'F').toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate">
                                  {f.users?.first_name || 'Faculty'} {f.users?.last_name || ''}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {f.users?.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                              {f.departments?.code || 'GEN'}
                            </span>
                            <p className="text-xs text-slate-500 truncate max-w-[180px]">
                              {f.departments?.name || 'General Dept'}
                            </p>
                          </td>
                          <td className="p-4 font-semibold text-slate-800 dark:text-slate-200 text-xs">
                            {f.designation}
                          </td>
                          <td className="p-4">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {f.office_room || 'Room TBA'}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
                              {f.specialization || 'General'}
                            </p>
                          </td>
                          <td className="p-4 text-center">
                            <Badge variant={isActive ? 'success' : 'danger'} size="sm">
                              {isActive ? 'Active' : 'Suspended'}
                            </Badge>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleUserStatus(f.user_id, isActive)}
                              className={`h-8 px-2.5 rounded-lg text-xs font-semibold ${
                                isActive
                                  ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30'
                                  : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30'
                              }`}
                            >
                              {isActive ? 'Suspend' : 'Activate'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Faculty Pagination */}
              <div className="p-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
                <span>
                  Showing {(facultyPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                  {Math.min(facultyPage * ITEMS_PER_PAGE, filteredFaculty.length)} of {filteredFaculty.length} faculty
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setFacultyPage(p => Math.max(1, p - 1))}
                    disabled={facultyPage === 1}
                    className="rounded-xl text-xs"
                  >
                    Previous
                  </Button>
                  <span className="font-semibold text-slate-900 dark:text-white px-2">
                    Page {facultyPage} of {Math.max(1, Math.ceil(filteredFaculty.length / ITEMS_PER_PAGE))}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setFacultyPage(p => p + 1)}
                    disabled={facultyPage * ITEMS_PER_PAGE >= filteredFaculty.length}
                    className="rounded-xl text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Faculty Card Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedFaculty.map(f => {
                const isActive = f.users?.is_active ?? true;
                return (
                  <div
                    key={f.id}
                    className="bg-white dark:bg-midnight-900 rounded-3xl border border-slate-200/80 dark:border-white/10 p-5 space-y-4 shadow-xs hover:border-indigo-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg">
                        {f.faculty_id}
                      </span>
                      <Badge variant={isActive ? 'success' : 'danger'} size="sm">
                        {isActive ? 'Active' : 'Suspended'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                        {(f.users?.first_name?.[0] || 'F').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">
                          {f.users?.first_name || 'Faculty'} {f.users?.last_name || ''}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {f.users?.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                          {f.departments?.code || 'GEN'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Designation</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                          {f.designation}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Office & Focus</span>
                        <span className="font-medium text-slate-600 dark:text-slate-300 truncate block">
                          {f.office_room || 'Room TBA'} • {f.specialization || 'General'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleUserStatus(f.user_id, isActive)}
                        className={`text-xs rounded-xl ${
                          isActive
                            ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400'
                        }`}
                      >
                        {isActive ? 'Suspend Account' : 'Activate Account'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: BULK STUDENT CSV IMPORT & ROSTER ONBOARDING               */}
      {/* =================================================================== */}
      {showBulkImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-[#0a0c16]/70 backdrop-blur-sm" onClick={handleCloseBulkModal} />
          <div className="relative bg-white dark:bg-midnight-950 p-6 rounded-3xl w-full max-w-3xl space-y-5 shadow-2xl border border-slate-200/90 dark:border-white/10 my-8">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Bulk Student Onboarding & Data Import
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Import student rosters from CSV, auto-validate departments, and synchronize credentials.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCloseBulkModal}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* STEP 1: INPUT MODE (FILE / PASTE) */}
            {bulkStep === 'input' && (
              <div className="space-y-4">
                {/* Template Download Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Standard Campus CSV Template
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Pre-populated with your university's active department codes ({departments.map(d => d.code).join(', ')}).
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleDownloadSampleCsv}
                    leftIcon={<Download className="h-3.5 w-3.5 text-blue-600" />}
                    className="rounded-xl text-xs font-bold shrink-0"
                  >
                    Download Sample CSV
                  </Button>
                </div>

                {/* Mode Selector */}
                <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 border border-slate-200/60 dark:border-white/5 text-xs font-bold">
                  <button
                    onClick={() => setBulkMode('upload')}
                    className={`flex-1 py-2 rounded-lg transition-all ${
                      bulkMode === 'upload'
                        ? 'bg-white dark:bg-midnight-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Upload CSV File
                  </button>
                  <button
                    onClick={() => setBulkMode('paste')}
                    className={`flex-1 py-2 rounded-lg transition-all ${
                      bulkMode === 'paste'
                        ? 'bg-white dark:bg-midnight-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Paste Raw CSV Data
                  </button>
                </div>

                {/* Mode 1: Drag & Drop File Upload */}
                {bulkMode === 'upload' ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all space-y-2 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv,text/plain"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:scale-105 transition-all">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Click to select or drag & drop CSV file
                      </p>
                      <p className="text-xs text-slate-400">Supports .csv or .txt up to 5 MB</p>
                    </div>
                  </div>
                ) : (
                  /* Mode 2: Paste Raw CSV Text */
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Paste CSV content (headers + rows):
                    </label>
                    <textarea
                      rows={6}
                      value={csvContent}
                      onChange={e => setCsvContent(e.target.value)}
                      placeholder="First Name,Last Name,Email,Student ID,Department Code,Course,Year,Semester,Division,CGPA,Points&#10;Aarav,Sharma,aarav@campus.edu,CS2026101,CSE,B.Tech in Computer Science,1,1,A,8.5,100"
                      className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => parseCsvText(csvContent)}
                        disabled={!csvContent.trim()}
                        className="rounded-xl text-xs font-bold"
                      >
                        Parse & Preview Rows
                      </Button>
                    </div>
                  </div>
                )}

                {/* Import Settings */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Default Initial Account Password
                    </label>
                    <input
                      type="text"
                      value={defaultPassword}
                      onChange={e => setDefaultPassword(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-900 text-slate-900 dark:text-white font-mono text-xs"
                      placeholder="e.g. Campus@2026"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Assigned to newly created student logins.</p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoGenerateId}
                        onChange={e => setAutoGenerateId(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Auto-generate ID if missing
                      </span>
                    </label>
                    <p className="text-[10px] text-slate-400">
                      Creates standardized IDs (e.g. CS2026xxxx) for any blank Student ID fields.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PREVIEW & VALIDATION TABLE */}
            {bulkStep === 'preview' && (
              <div className="space-y-4">
                {/* Statistics Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Rows</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {parsedRows.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-500 block">Valid Rows</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {parsedRows.filter(r => r.isValid).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-500 block">Errors / Invalid</span>
                    <span className="text-base font-black text-rose-600 dark:text-rose-400">
                      {parsedRows.filter(r => !r.isValid).length}
                    </span>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 dark:border-white/10 overflow-x-auto touch-pan-x text-xs">
                  <table className="w-full min-w-[640px] text-left">
                    <thead className="bg-slate-100 dark:bg-white/5 sticky top-0 font-bold text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-2.5">Row</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Student Name</th>
                        <th className="p-2.5">Email</th>
                        <th className="p-2.5">Student ID</th>
                        <th className="p-2.5">Dept</th>
                        <th className="p-2.5 text-center">Yr / Sem</th>
                        <th className="p-2.5 text-center">CGPA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {parsedRows.map(row => (
                        <tr
                          key={row.rowNum}
                          className={row.isValid ? 'hover:bg-slate-50 dark:hover:bg-white/[0.02]' : 'bg-rose-50/40 dark:bg-rose-950/20'}
                        >
                          <td className="p-2.5 font-mono text-slate-400">{row.rowNum}</td>
                          <td className="p-2.5">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" /> Valid
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400"
                                title={row.validationIssues.join('; ')}
                              >
                                <AlertCircle className="h-3 w-3" /> Error
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-white">
                            {row.first_name} {row.last_name}
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-400">{row.email}</td>
                          <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {row.student_id}
                          </td>
                          <td className="p-2.5">
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 font-mono font-semibold">
                              {row.dept_code}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            Y{row.year} • S{row.semester}
                          </td>
                          <td className="p-2.5 text-center font-bold">{row.cgpa.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBulkStep('input')}
                    className="rounded-xl text-xs"
                  >
                    Back to Upload
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleExecuteBulkImport}
                    disabled={parsedRows.filter(r => r.isValid).length === 0}
                    className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Import {parsedRows.filter(r => r.isValid).length} Valid Students
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: IMPORTING PROGRESS */}
            {bulkStep === 'importing' && (
              <div className="py-8 px-4 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 animate-pulse">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Processing Batch Import...
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    {importProgress.currentEmail || 'Configuring records...'}
                  </p>
                </div>

                <div className="max-w-md mx-auto space-y-1.5">
                  <div className="w-full bg-slate-100 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                    <span>
                      {importProgress.current} of {importProgress.total} completed
                    </span>
                    <span>
                      {importProgress.total > 0
                        ? Math.round((importProgress.current / importProgress.total) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: SUMMARY & RESULTS */}
            {bulkStep === 'summary' && (
              <div className="space-y-4 py-2">
                <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-center space-y-1">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                    Bulk Import Completed
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    The student roster and academic records have been refreshed.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-400 block uppercase font-bold text-[10px]">Newly Created</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {importSummary.successful}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-400 block uppercase font-bold text-[10px]">Profiles Updated</span>
                    <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                      {importSummary.updated}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-400 block uppercase font-bold text-[10px]">Failed / Skipped</span>
                    <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                      {importSummary.failed}
                    </span>
                  </div>
                </div>

                {/* Error Breakdown if any */}
                {importSummary.errors.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      Failed Records ({importSummary.errors.length}):
                    </p>
                    <div className="max-h-36 overflow-y-auto p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 text-[11px] space-y-1">
                      {importSummary.errors.map((err, idx) => (
                        <p key={idx} className="text-rose-700 dark:text-rose-300">
                          <span className="font-bold">Row {err.row} ({err.email}):</span> {err.reason}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-white/5">
                  <Button
                    onClick={handleCloseBulkModal}
                    className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Done & Return to Directory
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: STUDENT ACADEMIC DOSSIER QUICK-VIEW & EDIT                */}
      {/* =================================================================== */}
      {showEditStudentModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-[#0a0c16]/70 backdrop-blur-sm" onClick={() => setShowEditStudentModal(false)} />
          <div className="relative bg-white dark:bg-midnight-950 p-6 rounded-3xl w-full max-w-xl space-y-5 shadow-2xl border border-slate-200/90 dark:border-white/10 my-8">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                  {(selectedStudent.users?.first_name?.[0] || 'S').toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedStudent.users?.first_name || 'Student'} {selectedStudent.users?.last_name || ''}
                    </h3>
                    <Badge variant={selectedStudent.users?.is_active ? 'success' : 'danger'} size="sm">
                      {selectedStudent.users?.is_active ? 'Active' : 'Suspended'}
                    </Badge>
                  </div>
                  <p className="text-xs font-mono text-blue-600 dark:text-blue-400">
                    ID: {selectedStudent.student_id} • {selectedStudent.users?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditStudentModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Academic Dossier Editor */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Department Selection */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Department
                  </label>
                  <select
                    value={studentEditForm.department_id}
                    onChange={e => setStudentEditForm({ ...studentEditForm, department_id: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-900 text-slate-900 dark:text-white"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id} className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Course Name */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Program / Degree Course
                  </label>
                  <input
                    type="text"
                    value={studentEditForm.course}
                    onChange={e => setStudentEditForm({ ...studentEditForm, course: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Year */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Academic Year
                  </label>
                  <select
                    value={studentEditForm.year}
                    onChange={e => setStudentEditForm({ ...studentEditForm, year: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-900 text-slate-900 dark:text-white"
                  >
                    <option value={1} className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Year 1 (Freshman)</option>
                    <option value={2} className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Year 2 (Sophomore)</option>
                    <option value={3} className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Year 3 (Junior)</option>
                    <option value={4} className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">Year 4 (Senior)</option>
                  </select>
                </div>

                {/* Semester */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Semester
                  </label>
                  <select
                    value={studentEditForm.semester}
                    onChange={e => setStudentEditForm({ ...studentEditForm, semester: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-900 text-slate-900 dark:text-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s} className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-white">
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Division */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Division / Section
                  </label>
                  <input
                    type="text"
                    value={studentEditForm.division}
                    onChange={e => setStudentEditForm({ ...studentEditForm, division: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-900 text-slate-900 dark:text-white uppercase font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* CGPA */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Cumulative CGPA (0.00 - 10.00)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={studentEditForm.cgpa}
                    onChange={e => setStudentEditForm({ ...studentEditForm, cgpa: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-900 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                {/* Points */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Campus Reward Points
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={studentEditForm.points}
                    onChange={e => setStudentEditForm({ ...studentEditForm, points: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-midnight-900 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Placement Readiness Score */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Placement Readiness ({studentEditForm.placement_readiness_score}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={studentEditForm.placement_readiness_score}
                    onChange={e => setStudentEditForm({ ...studentEditForm, placement_readiness_score: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* Engagement Score */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Engagement Score ({studentEditForm.engagement_score}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={studentEditForm.engagement_score}
                    onChange={e => setStudentEditForm({ ...studentEditForm, engagement_score: Number(e.target.value) })}
                    className="w-full accent-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditStudentModal(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveStudentEdit}
                disabled={isSavingStudent}
                className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSavingStudent ? 'Saving...' : 'Save Academic Record'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: ASSIGN FACULTY MEMBER                                     */}
      {/* =================================================================== */}
      {showAddFacultyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-[#0a0c16]/70 backdrop-blur-sm" onClick={() => setShowAddFacultyModal(false)} />
          <div className="relative bg-white dark:bg-midnight-950 p-6 rounded-3xl w-full max-w-md space-y-4 shadow-2xl border border-slate-200/90 dark:border-white/10 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Assign Faculty Member
                </h3>
                <p className="text-xs text-slate-500">
                  Select a registered user to assign faculty status and departmental duties.
                </p>
              </div>
              <button
                onClick={() => setShowAddFacultyModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Select User Account
                </label>
                <select
                  className="w-full border rounded-xl p-2.5 bg-slate-50 dark:bg-midnight-900 dark:border-white/10 text-slate-900 dark:text-white"
                  value={facultyForm.user_id}
                  onChange={e => setFacultyForm({ ...facultyForm, user_id: e.target.value })}
                >
                  <option value="" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100">
                    -- Choose User --
                  </option>
                  {candidateUsers.map(u => (
                    <option key={u.id} value={u.id} className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100">
                      {u.first_name || 'User'} {u.last_name || ''} ({u.email}) - [{u.role}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Faculty / Employee ID
                </label>
                <input
                  placeholder="e.g. FAC101"
                  className="w-full border rounded-xl p-2.5 bg-slate-50 dark:bg-midnight-900 dark:border-white/10 text-slate-900 dark:text-white uppercase font-mono"
                  value={facultyForm.faculty_id}
                  onChange={e => setFacultyForm({ ...facultyForm, faculty_id: e.target.value })}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Department
                </label>
                <select
                  className="w-full border rounded-xl p-2.5 bg-slate-50 dark:bg-midnight-900 dark:border-white/10 text-slate-900 dark:text-white"
                  value={facultyForm.department_id}
                  onChange={e => setFacultyForm({ ...facultyForm, department_id: Number(e.target.value) })}
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id} className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100">
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Designation
                  </label>
                  <select
                    className="w-full border rounded-xl p-2.5 bg-slate-50 dark:bg-midnight-900 dark:border-white/10 text-slate-900 dark:text-white"
                    value={facultyForm.designation}
                    onChange={e => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                  >
                    <option value="Assistant Professor" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100">Assistant Professor</option>
                    <option value="Associate Professor" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100">Associate Professor</option>
                    <option value="Professor" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100">Professor</option>
                    <option value="HOD" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100">HOD</option>
                    <option value="Lecturer" className="bg-white dark:bg-midnight-900 text-slate-900 dark:text-slate-100">Lecturer</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Office Room
                  </label>
                  <input
                    placeholder="e.g. Block B-204"
                    className="w-full border rounded-xl p-2.5 bg-slate-50 dark:bg-midnight-900 dark:border-white/10 text-slate-900 dark:text-white"
                    value={facultyForm.office_room}
                    onChange={e => setFacultyForm({ ...facultyForm, office_room: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Specialization
                </label>
                <input
                  placeholder="e.g. Cloud Computing & Distributed Systems"
                  className="w-full border rounded-xl p-2.5 bg-slate-50 dark:bg-midnight-900 dark:border-white/10 text-slate-900 dark:text-white"
                  value={facultyForm.specialization}
                  onChange={e => setFacultyForm({ ...facultyForm, specialization: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
              <Button variant="ghost" size="sm" onClick={() => setShowAddFacultyModal(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddFaculty}
                disabled={isSubmittingFaculty}
                className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmittingFaculty ? 'Assigning...' : 'Assign Faculty'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
