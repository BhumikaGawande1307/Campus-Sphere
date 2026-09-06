import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Announcement, Notification } from '../types';

export const announcementService = {
  async getAnnouncements(params?: any): Promise<Announcement[]> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    let query = supabase.from('announcements').select('*, author:users!author_id(*)').order('created_at', { ascending: false });

    if (params?.priority && params.priority !== 'ALL') {
      query = query.eq('priority', params.priority);
    }
    if (params?.category && params.category !== 'ALL') {
      query = query.eq('category', params.category);
    }

    const { data, error } = await query;
    if (error) {
       if (error.code === '42P01') return [];
       throw error;
    }
    return data as unknown as Announcement[];
  },

  async createAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) throw new Error('Not authenticated');
const { data: newAnn, error } = await supabase
      .from('announcements')
      .insert({
        title: data.title || 'Official Announcement',
        content: data.content || '',
        category: data.category || 'College announcement',
        priority: data.priority || 'NORMAL',
        author_id: session.session.user.id,
      })
      .select('*, author:users!author_id(*)')
      .single();

    if (error) throw error;
    return newAnn as unknown as Announcement;
  },

  async getNotifications(): Promise<Notification[]> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) throw new Error('Not authenticated');
const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
       if (error.code === '42P01') return [];
       throw error;
    }
    return data as unknown as Notification[];
  },

  async markNotificationRead(id: string | number): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (error && error.code !== '42P01') throw error;
  },
};
