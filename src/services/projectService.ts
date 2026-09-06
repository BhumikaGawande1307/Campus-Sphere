import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Project } from '../types';

export const projectService = {
  async getProjects(): Promise<Project[]> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) throw new Error('Not authenticated');
    const userId = session.session.user.id;

    // Resolve student's numeric ID if present
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const studentIntId = student?.id;

    try {
      // Query projects by user_id OR student_id (if student profile exists)
      let query = supabase.from('projects').select('*');
      if (studentIntId) {
        query = query.or(`user_id.eq.${userId},student_id.eq.${studentIntId}`);
      } else {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) {
        // Fallback if user_id column is not yet migrated
        if (error.code === '42703' && studentIntId) {
          const { data: fallbackData } = await supabase
            .from('projects')
            .select('*')
            .eq('student_id', studentIntId);
          return (fallbackData || []) as unknown as Project[];
        }
        if (error.code === '42P01') return [];
        console.warn('Error fetching projects:', error.message);
        return [];
      }
      return (data || []) as unknown as Project[];
    } catch (err) {
      console.warn('getProjects error caught:', err);
      return [];
    }
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) throw new Error('Not authenticated');
    const userId = session.session.user.id;

    let studentId: number | null = null;
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (student) {
      studentId = student.id;
    }

    const payload: any = {
      user_id: userId,
      title: data.title || 'New Engineering Project',
      description: data.description || '',
      technologies: data.technologies || 'React, TypeScript, Supabase',
      team_members: data.team_members || '',
      github_link: data.github_link || '',
      demo_link: data.demo_link || '',
      faculty_mentor: data.faculty_mentor || '',
      status: data.status || 'Development',
    };

    if (studentId) {
      payload.student_id = studentId;
    }

    const { data: newProject, error } = await supabase
      .from('projects')
      .insert(payload)
      .select()
      .single();
      
    if (error) {
      if (error.code === '42703' && studentId) {
        const { data: fbProject, error: fbError } = await supabase
          .from('projects')
          .insert({
            student_id: studentId,
            title: data.title || 'New Engineering Project',
            description: data.description || '',
            technologies: data.technologies || 'React, TypeScript, Supabase',
            team_members: data.team_members || '',
            github_link: data.github_link || '',
            demo_link: data.demo_link || '',
            faculty_mentor: data.faculty_mentor || '',
            status: data.status || 'Development',
          })
          .select()
          .single();
        if (fbError) throw fbError;
        return fbProject as unknown as Project;
      }
      throw error;
    }
    return newProject as unknown as Project;
  },

  async deleteProject(id: string | number): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error && error.code !== '42P01') throw error;
  },
};
