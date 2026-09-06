import { supabase, isSupabaseConfigured } from './supabaseClient';
import { StudentProfile, StudentDashboardData, User } from '../types';

export interface ProfileCompletionStatus {
  percentage: number;
  completed_count: number;
  total_count: number;
  items: Array<{
    id: string;
    label: string;
    is_completed: boolean;
    route: string;
    action_text: string;
  }>;
}

export const studentService = {
  async getMyProfile(): Promise<StudentProfile> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) throw new Error('Not authenticated');

    const { data: student, error } = await supabase
      .from('students')
      .select('*, user:users(*), department:departments(*)')
      .eq('user_id', session.session.user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching student profile:', error);
      throw error;
    }

    if (!student) {
      throw new Error('Student profile not found for this user.');
    }

    return student as unknown as StudentProfile;
  },

  async updateProfile(data: Partial<StudentProfile> & { user?: Partial<User> }): Promise<StudentProfile> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const profile = await this.getMyProfile();

    if (data.user) {
      const { error: userError } = await supabase
        .from('users')
        .update({
          first_name: data.user.first_name,
          last_name: data.user.last_name,
          phone_number: data.user.phone_number || data.phone_number,
          avatar_url: data.user.avatar_url,
        })
        .eq('id', profile.user_id);
      
      if (userError) throw userError;
    }

    const { error: studentError } = await supabase
      .from('students')
      .update({
        student_id: data.student_id,
        department_id: data.department_id ? Number(data.department_id) : undefined,
        course: data.course,
        year: data.year ? Number(data.year) : undefined,
        semester: data.semester ? Number(data.semester) : undefined,
        division: data.division,
        cgpa: data.cgpa ? Number(data.cgpa) : undefined,
        github_url: data.github_url,
        linkedin_url: data.linkedin_url,
        portfolio_url: data.portfolio_url,
      })
      .eq('id', profile.id);

    if (studentError) throw studentError;

    return this.getMyProfile();
  },

  async calculateProfileCompletion(): Promise<ProfileCompletionStatus> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    const profile = await this.getMyProfile();

    const [
      { count: skillsCount },
      { count: projectsCount },
    ] = await Promise.all([
      supabase.from('skills').select('id', { count: 'exact', head: true }).or(`user_id.eq.${profile.user_id},student_id.eq.${profile.id}`),
      supabase.from('projects').select('id', { count: 'exact', head: true }).or(`user_id.eq.${profile.user_id},student_id.eq.${profile.id}`),
    ]);

    const checklist = [
      {
        id: 'links',
        label: 'Connect GitHub and LinkedIn Profiles',
        is_completed: Boolean(profile.github_url && profile.linkedin_url),
        route: '/profile',
        action_text: 'Add Links',
      },
      {
        id: 'skills',
        label: 'Log at least 3 Technical Competencies',
        is_completed: (skillsCount || 0) >= 3,
        route: '/skills-projects',
        action_text: 'Add Skills',
      },
      {
        id: 'projects',
        label: 'Showcase at least 2 Engineering Projects',
        is_completed: (projectsCount || 0) >= 2,
        route: '/skills-projects',
        action_text: 'Add Projects',
      },
    ];

    const completed = checklist.filter((i) => i.is_completed).length;
    const percentage = Math.round((completed / checklist.length) * 100);

    return {
      percentage,
      completed_count: completed,
      total_count: checklist.length,
      items: checklist,
    };
  },

  async getDashboard(): Promise<StudentDashboardData> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    const profile = await this.getMyProfile();

    // Fetch related dashboard data from Supabase
    const [
      { data: events },
      { data: registrations },
      { data: notifications },
      { count: certificatesCount, data: latestCerts },
      { count: skillsCount },
      { count: projectsCount },
      { count: applicationsCount },
    ] = await Promise.all([
      supabase.from('events').select('*, department:departments(*)').limit(3).order('start_date', { ascending: true }),
      supabase.from('event_registrations').select('*').eq('user_id', profile.user_id),
      supabase.from('notifications').select('*').eq('user_id', profile.user_id).order('created_at', { ascending: false }).limit(5),
      supabase.from('certificates').select('*', { count: 'exact' }).eq('student_id', profile.user_id).order('created_at', { ascending: false }).limit(4),
      supabase.from('skills').select('id', { count: 'exact', head: true }).or(`user_id.eq.${profile.user_id},student_id.eq.${profile.id}`),
      supabase.from('projects').select('id', { count: 'exact', head: true }).or(`user_id.eq.${profile.user_id},student_id.eq.${profile.id}`),
      supabase.from('applications').select('id', { count: 'exact', head: true }).eq('student_id', profile.user_id),
    ]);

    const certCount = certificatesCount || 0;
    const skillCount = skillsCount || 0;
    const projCount = projectsCount || 0;
    const appCount = applicationsCount || 0;

    return {
      profile,
      stats: {
        total_activities: registrations?.length || 0,
        events_participated: registrations?.filter(r => r.status === 'ATTENDED').length || 0,
        certificates_count: certCount,
        achievements_count: certCount,
        skills_count: skillCount,
        projects_count: projCount,
        internships_applied: appCount,
        attendance_rate: 100,
        points: profile.points || 0,
        engagement_score: profile.engagement_score || 50,
        placement_readiness_score: profile.placement_readiness_score || 50,
      },
      upcoming_events: events || [],
      latest_certificates: latestCerts || [],
      recommended_opportunities: [],
      achievement_timeline: [],
      notifications: notifications || [],
    };
  },
};
