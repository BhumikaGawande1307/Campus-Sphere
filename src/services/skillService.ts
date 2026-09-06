import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Skill } from '../types';

export const skillService = {
  async getSkills(): Promise<Skill[]> {
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
      // Query skills by user_id OR student_id (if student profile exists)
      let query = supabase.from('skills').select('*');
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
            .from('skills')
            .select('*')
            .eq('student_id', studentIntId);
          return (fallbackData || []) as unknown as Skill[];
        }
        if (error.code === '42P01') return [];
        console.warn('Error fetching skills:', error.message);
        return [];
      }
      return (data || []) as unknown as Skill[];
    } catch (err) {
      console.warn('getSkills error caught:', err);
      return [];
    }
  },

  async addSkill(data: Partial<Skill>): Promise<Skill> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) throw new Error('Not authenticated');
    const userId = session.session.user.id;

    // Resolve student record
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
      name: data.name || 'New Skill',
      category: data.category || 'Programming',
      proficiency: data.proficiency || 'INTERMEDIATE',
      is_verified: false,
    };

    if (studentId) {
      payload.student_id = studentId;
    }

    const { data: newSkill, error } = await supabase
      .from('skills')
      .insert(payload)
      .select()
      .single();
      
    if (error) {
      // Fallback if user_id is not yet in schema
      if (error.code === '42703' && studentId) {
        const { data: fbSkill, error: fbError } = await supabase
          .from('skills')
          .insert({
            student_id: studentId,
            name: data.name || 'New Skill',
            category: data.category || 'Programming',
            proficiency: data.proficiency || 'INTERMEDIATE',
            is_verified: false,
          })
          .select()
          .single();
        if (fbError) throw fbError;
        return fbSkill as unknown as Skill;
      }
      throw error;
    }
    return newSkill as unknown as Skill;
  },

  async deleteSkill(id: string | number): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    const { error } = await supabase.from('skills').delete().eq('id', id);
    if (error && error.code !== '42P01') throw error;
  },
};
