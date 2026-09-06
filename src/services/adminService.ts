import { supabase, isSupabaseConfigured } from './supabaseClient';
import { User, UserRole } from '../types';

export interface SiteSettings {
  hero_title: string;
  hero_description: string;
  hero_badge: string;
  primary_cta_text: string;
  secondary_cta_text: string;
  stats_students: string;
  stats_attendance: string;
  stats_placements: string;
  stats_scholarships: string;
  faqs: any[];
  maintenance_mode: boolean;
  academic_year?: string;
  current_semester?: number;
  attendance_threshold?: number;
  branding_config?: any;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  previous_state: any;
  new_state: any;
  created_at: string;
  actor?: User;
}

class AdminService {
  _permissionsCache = new Set<string>();
  _permissionsLoaded = false;

  async loadMyPermissions(forceRefresh = false): Promise<string[]> {
    if (!isSupabaseConfigured) return [];
    if (this._permissionsLoaded && !forceRefresh) return Array.from(this._permissionsCache);

    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return [];
    const currentUserId = session.session.user.id;

    // Check user role from public.users
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUserId)
      .maybeSingle();

    const userRole = profile?.role || session.session.user.user_metadata?.role || 'STUDENT';

    // All available administrative permissions
    const allAdminPermissions = [
      'students.view',
      'students.create',
      'students.update',
      'students.deactivate',
      'faculty.view',
      'faculty.manage',
      'timetable.view',
      'timetable.manage',
      'attendance.view',
      'attendance.manage',
      'results.view',
      'results.manage',
      'results.publish',
      'grievances.view',
      'grievances.assign',
      'grievances.resolve',
      'scholarships.view',
      'scholarships.manage',
      'events.view',
      'events.manage',
      'documents.view',
      'documents.manage',
      'audit_logs.view',
      'system_settings.manage',
      'users.manage',
    ];

    // If user is Admin or Super Admin, grant all permissions immediately
    if (['ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR'].includes(userRole)) {
      this._permissionsCache = new Set(allAdminPermissions);
      this._permissionsLoaded = true;
      return allAdminPermissions;
    }

    if (['FACULTY', 'HOD'].includes(userRole)) {
      const facultyPerms = [
        'students.view',
        'faculty.view',
        'timetable.view',
        'attendance.view',
        'attendance.manage',
        'results.view',
        'results.manage',
        'documents.view',
        'events.view',
        'scholarships.view',
        'grievances.view',
      ];
      this._permissionsCache = new Set(facultyPerms);
      this._permissionsLoaded = true;
      return facultyPerms;
    }

    // Otherwise fetch dynamic granular permissions from user_roles
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles(
          name,
          role_permissions(
            permissions(code)
          )
        )
      `)
      .eq('user_id', currentUserId);

    if (error) {
      console.warn('Could not query user_roles table:', error.message);
      return [];
    }

    const perms = new Set<string>();
    data?.forEach((ur: any) => {
      ur.roles?.role_permissions?.forEach((rp: any) => {
        if (rp.permissions?.code) {
          perms.add(rp.permissions.code);
        }
      });
    });

    this._permissionsCache = perms;
    this._permissionsLoaded = true;
    return Array.from(perms);
  }

  async hasPermission(code: string): Promise<boolean> {
    const perms = await this.loadMyPermissions();
    return perms.includes(code);
  }

  async requirePermission(code: string): Promise<void> {
    const hasPerm = await this.hasPermission(code);
    if (!hasPerm) {
      throw new Error(`Unauthorized: Missing permission '${code}'`);
    }
  }

  async logAction(
    action: string,
    resourceType: string,
    resourceId?: string,
    previousState?: any,
    newState?: any
  ): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;
try {
      await supabase.from('audit_logs').insert({
        actor_id: session.session.user.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        previous_state: previousState ? JSON.stringify(previousState) : null,
        new_state: newState ? JSON.stringify(newState) : null,
      });
    } catch (e) {
      console.warn('Failed to write audit log:', e);
    }
  }

  async getAuditLogs(params?: any): Promise<AuditLog[]> {
    if (!isSupabaseConfigured) return [];
    
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, actor:users!actor_id(*)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      if (error.code === '42P01') return [];
      throw error;
    }
    return data as AuditLog[];
  }

  async getSiteSettings(): Promise<SiteSettings> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error && error.code !== '42P01') {
      console.warn('Error reading system_settings:', error.message);
    }

    if (data) {
      return {
        hero_title: data.hero_title || 'The Intelligent Operating Platform for Modern University Campus Life',
        hero_description: data.hero_description || 'Empowering students to verify cryptographic credentials...',
        hero_badge: data.hero_badge || 'Next-Gen University Operating System',
        primary_cta_text: data.primary_cta_text || 'Launch Student Hub',
        secondary_cta_text: data.secondary_cta_text || 'Explore Opportunities',
        stats_students: data.stats_students || '4,200+',
        stats_attendance: data.stats_attendance || '99.4%',
        stats_placements: data.stats_placements || '96%',
        stats_scholarships: data.stats_scholarships || '₹1.2 Cr+',
        faqs: Array.isArray(data.faqs) ? data.faqs : [],
        maintenance_mode: Boolean(data.maintenance_mode),
        academic_year: data.academic_year || '2025-2026',
        current_semester: data.current_semester || 1,
        attendance_threshold: data.attendance_threshold || 75,
        branding_config: data.branding_config || null,
      };
    }

    return {
      hero_title: 'The Intelligent Operating Platform for Modern University Campus Life',
      hero_description: 'Empowering students to verify cryptographic credentials...',
      hero_badge: 'Next-Gen University Operating System',
      primary_cta_text: 'Launch Student Hub',
      secondary_cta_text: 'Explore Opportunities',
      stats_students: '4,200+',
      stats_attendance: '99.4%',
      stats_placements: '96%',
      stats_scholarships: '₹1.2 Cr+',
      faqs: [],
      maintenance_mode: false,
      academic_year: '2025-2026',
      current_semester: 1,
      attendance_threshold: 75,
      branding_config: null,
    };
  }

  async updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const updatePayload: any = {
      id: 1,
      updated_at: new Date().toISOString(),
    };

    if (settings.hero_title !== undefined) updatePayload.hero_title = settings.hero_title;
    if (settings.hero_description !== undefined) updatePayload.hero_description = settings.hero_description;
    if (settings.hero_badge !== undefined) updatePayload.hero_badge = settings.hero_badge;
    if (settings.primary_cta_text !== undefined) updatePayload.primary_cta_text = settings.primary_cta_text;
    if (settings.secondary_cta_text !== undefined) updatePayload.secondary_cta_text = settings.secondary_cta_text;
    if (settings.stats_students !== undefined) updatePayload.stats_students = settings.stats_students;
    if (settings.stats_attendance !== undefined) updatePayload.stats_attendance = settings.stats_attendance;
    if (settings.stats_placements !== undefined) updatePayload.stats_placements = settings.stats_placements;
    if (settings.stats_scholarships !== undefined) updatePayload.stats_scholarships = settings.stats_scholarships;
    if (settings.faqs !== undefined) updatePayload.faqs = settings.faqs;
    if (settings.maintenance_mode !== undefined) updatePayload.maintenance_mode = settings.maintenance_mode;
    if (settings.academic_year !== undefined) updatePayload.academic_year = settings.academic_year;
    if (settings.current_semester !== undefined) updatePayload.current_semester = settings.current_semester;
    if (settings.attendance_threshold !== undefined) updatePayload.attendance_threshold = settings.attendance_threshold;
    if (settings.branding_config !== undefined) updatePayload.branding_config = settings.branding_config;

    const { data, error } = await supabase
      .from('system_settings')
      .upsert(updatePayload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Failed to update system_settings:', error);
      throw error;
    }

    await this.logAction('UPDATE_SETTINGS', 'system_settings', '1', null, settings);
    return this.getSiteSettings();
  }

  async getUsers(params?: any): Promise<User[]> {
    await this.requirePermission('users.view'); // Optional check
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    let query = supabase.from('users').select('*');
    if (params?.role && params.role !== 'ALL') query = query.eq('role', params.role);
    if (params?.status && params.status !== 'ALL') query = query.eq('is_active', params.status === 'ACTIVE');
    
    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as User[];
  }

  async toggleUserStatus(userId: string | number): Promise<User> {
    await this.requirePermission('users.manage');
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const { data: currentUser } = await supabase.from('users').select('is_active').eq('id', userId).single();
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: !currentUser?.is_active })
      .eq('id', userId)
      .select().single();

    if (error) throw error;
    await this.logAction('TOGGLE_USER_STATUS', 'users', String(userId), { is_active: currentUser?.is_active }, { is_active: !currentUser?.is_active });
    return data as unknown as User;
  }

  async updateUserRole(userId: string | number, newRole: UserRole): Promise<User> {
    await this.requirePermission('users.manage');
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const { data, error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .select().single();

    if (error) throw error;
    await this.logAction('UPDATE_USER_ROLE', 'users', String(userId), null, { role: newRole });
    return data as unknown as User;
  }

  async getPlatformOverview(): Promise<any> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    
    const [
      { count: total_students },
      { count: total_faculty },
      { count: total_events },
      { count: total_scholarships },
      { count: attendance_sessions },
      { count: open_grievances },
      { count: pending_certificates },
      { count: pending_scholarships },
      { count: total_registrations },
      { count: total_certificates },
      { count: total_jobs },
      { count: total_applications }
    ] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }),
      supabase.from('faculty').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('scholarships').select('*', { count: 'exact', head: true }),
      supabase.from('attendance_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('grievances').select('*', { count: 'exact', head: true }).in('status', ['OPEN', 'IN_PROGRESS']),
      supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase.from('scholarship_applications').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase.from('event_registrations').select('*', { count: 'exact', head: true }),
      supabase.from('certificates').select('*', { count: 'exact', head: true }),
      supabase.from('jobs').select('*', { count: 'exact', head: true }),
      supabase.from('applications').select('*', { count: 'exact', head: true })
    ]);

    const auditLogs = await this.getAuditLogs();

    return {
      stats: {
        total_students: total_students || 0,
        total_faculty: total_faculty || 0,
        total_events: total_events || 0,
        total_registrations: total_registrations || 0,
        total_certificates: total_certificates || 0,
        total_scholarships: total_scholarships || 0,
        total_jobs: total_jobs || 0,
        total_applications: total_applications || 0,
        attendance_sessions: attendance_sessions || 0,
        open_grievances: open_grievances || 0,
        pending_approvals: (pending_certificates || 0) + (pending_scholarships || 0)
      },
      recent_activity: auditLogs.slice(0, 10),
    };
  }

  async search(searchTerm: string, userRole: string = 'STUDENT') {
    const searchPattern = `%${searchTerm}%`;
    const searchResults: { type: string; id: string; title: string; subtitle: string; path: string }[] = [];
    const role = (userRole || 'STUDENT').toUpperCase();
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR', 'COORDINATOR'].includes(role);
    const isFaculty = ['FACULTY', 'HOD'].includes(role);

    // Search Users
    const { data: users } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .or(`email.ilike.${searchPattern},first_name.ilike.${searchPattern},last_name.ilike.${searchPattern}`)
      .limit(5);

    users?.forEach((u) => {
      let userPath = '/profile';
      if (isAdmin) {
        userPath = u.role === 'STUDENT' ? '/admin/students' : '/admin/faculty';
      } else if (isFaculty) {
        userPath = u.role === 'STUDENT' ? '/dashboard/faculty' : '/profile';
      }

      searchResults.push({
        type: 'user',
        id: u.id,
        title: `${u.first_name} ${u.last_name}`,
        subtitle: `${u.role} • ${u.email}`,
        path: userPath
      });
    });

    // Search Grievances
    const { data: grievances } = await supabase
      .from('grievances')
      .select('id, ticket_number, title')
      .or(`ticket_number.ilike.${searchPattern},title.ilike.${searchPattern}`)
      .limit(3);

    grievances?.forEach((g) => {
      searchResults.push({
        type: 'grievance',
        id: g.id,
        title: g.title,
        subtitle: `Ticket #${g.ticket_number}`,
        path: isAdmin ? `/admin/grievances` : `/grievances`
      });
    });

    // Search Events
    const { data: events } = await supabase
      .from('events')
      .select('id, title, category')
      .ilike('title', searchPattern)
      .limit(3);

    events?.forEach((e) => {
      searchResults.push({
        type: 'event',
        id: e.id,
        title: e.title,
        subtitle: `Event • ${e.category}`,
        path: isAdmin ? `/admin/events` : `/events`
      });
    });

    // Search Certificates (using canonical column certificate_uid)
    const { data: certificates } = await supabase
      .from('certificates')
      .select('id, certificate_uid, title')
      .or(`certificate_uid.ilike.${searchPattern},title.ilike.${searchPattern}`)
      .limit(3);

    certificates?.forEach((c) => {
      let certPath = '/certificates';
      if (isAdmin) {
        certPath = '/admin/approvals';
      } else if (isFaculty) {
        certPath = '/faculty/certificates';
      }

      searchResults.push({
        type: 'certificate',
        id: c.id,
        title: c.title || `Certificate #${c.certificate_uid}`,
        subtitle: `Certificate • #${c.certificate_uid}`,
        path: certPath
      });
    });

    return searchResults;
  }
}

export const adminService = new AdminService();
