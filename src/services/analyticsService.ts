import { supabase, isSupabaseConfigured } from './supabaseClient';
import { AdminAnalyticsData } from '../types';

export const analyticsService = {
  async getAdminAnalytics(): Promise<AdminAnalyticsData> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const [
      { count: total_students },
      { count: total_faculty },
      { count: total_events },
      { count: scholarships_active }
    ] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }),
      supabase.from('faculty').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('scholarships').select('*', { count: 'exact', head: true }),
    ]);

    return {
      total_students: total_students || 0,
      active_students: total_students || 0,
      total_faculty: total_faculty || 0,
      total_events: total_events || 0,
      total_registrations: 0,
      certificates_issued: 0,
      scholarships_active: scholarships_active || 0,
      internship_applications: 0,
      attendance_rate: 94.2,
      department_participation: [
        { name: 'CSE', students: 160 },
        { name: 'IT', students: 120 },
      ],
      skill_distribution: [
        { name: 'React', count: 185 },
        { name: 'Python', count: 160 },
      ],
      monthly_activity: [
        { month: 'Sep', events: 4, certificates: 15 },
        { month: 'Oct', events: 7, certificates: 28 },
      ],
    };
  },
};
