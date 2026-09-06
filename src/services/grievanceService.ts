import { supabase, isSupabaseConfigured } from './supabaseClient';
import { notificationSocketService } from './notificationSocketService';
import {
  GrievanceTicket,
  GrievanceMessage,
  GrievanceStatus,
  GrievancePriority,
  GrievanceCategory,
  GrievanceAttachment,
} from '../types';

function normalizeTicket(t: any): GrievanceTicket {
  const rawStudent = t.student || {};
  const studentObj = {
    ...rawStudent,
    user: rawStudent.user || rawStudent,
    first_name: rawStudent.first_name || rawStudent.user?.first_name || '',
    last_name: rawStudent.last_name || rawStudent.user?.last_name || '',
    email: rawStudent.email || rawStudent.user?.email || '',
    avatar_url: rawStudent.avatar_url || rawStudent.user?.avatar_url || '',
    role: rawStudent.role || rawStudent.user?.role || 'STUDENT',
  };

  const rawAssigned = t.assigned || t.assigned_to || {};
  const assignedObj =
    typeof rawAssigned === 'object' && rawAssigned !== null && Object.keys(rawAssigned).length > 0
      ? {
          ...rawAssigned,
          first_name: rawAssigned.first_name || '',
          last_name: rawAssigned.last_name || '',
          email: rawAssigned.email || '',
          role: rawAssigned.role || 'STAFF',
        }
      : undefined;

  let attachmentsList: GrievanceAttachment[] = [];
  if (t.attachments) {
    if (Array.isArray(t.attachments)) {
      attachmentsList = t.attachments;
    } else if (typeof t.attachments === 'string') {
      try {
        const parsed = JSON.parse(t.attachments);
        attachmentsList = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        attachmentsList = [{ url: t.attachments, name: 'Attachment' }];
      }
    }
  }

  const primaryAttachmentUrl =
    attachmentsList.length > 0 ? attachmentsList[0].url : t.attachment_url || undefined;

  return {
    ...t,
    id: t.id,
    title: t.title || 'No Title',
    ticket_uid: t.ticket_number || t.ticket_uid || `GRV-${t.id}`,
    ticket_number: t.ticket_number || t.ticket_uid || `GRV-${t.id}`,
    student: studentObj,
    assigned: assignedObj,
    assigned_to: assignedObj,
    attachments: attachmentsList,
    attachment_url: primaryAttachmentUrl,
  } as unknown as GrievanceTicket;
}

async function uploadAttachmentFile(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `grievance-${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  // Attempt upload to Supabase storage bucket
  const bucketsToTry = ['grievances', 'certificates'];
  for (const bucket of bucketsToTry) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

      if (!error && data) {
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(fileName);
        if (pub?.publicUrl) {
          return pub.publicUrl;
        }
      }
    } catch {
      // Continue to next bucket or data URL fallback
    }
  }

  // High-reliability fallback: Read file as Base64 Data URL to safely persist in database JSONB
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

async function getCurrentUserOrThrow(errorMessage = 'Not authenticated'): Promise<{ id: string; role?: string; email?: string }> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) {
      return data.session.user;
    }
  } catch {}

  const localUserStr = typeof localStorage !== 'undefined' ? localStorage.getItem('cs_user') : null;
  if (localUserStr) {
    try {
      const parsed = JSON.parse(localUserStr);
      if (parsed?.id) return parsed;
    } catch {}
  }

  throw new Error(errorMessage);
}

export const grievanceService = {
  async getTickets(filters?: {
    category?: string;
    status?: string;
    priority?: string;
    search?: string;
    departmentId?: number;
    userId?: string;
  }): Promise<GrievanceTicket[]> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    await getCurrentUserOrThrow('Not authenticated');

    let query = supabase
      .from('grievances')
      .select('*, student:users!submitted_by(*), department:departments(*), assigned:users!assigned_to(*)')
      .order('created_at', { ascending: false });

    if (filters?.userId) {
      query = query.eq('submitted_by', filters.userId);
    }
    if (filters?.category && filters.category !== 'ALL') {
      query = query.eq('category', filters.category);
    }
    if (filters?.status && filters.status !== 'ALL') {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority && filters.priority !== 'ALL') {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.departmentId) {
      query = query.eq('department_id', filters.departmentId);
    }
    if (filters?.search && filters.search.trim()) {
      const s = filters.search.trim();
      query = query.or(
        `ticket_number.ilike.%${s}%,title.ilike.%${s}%,description.ilike.%${s}%`
      );
    }

    let { data, error } = await query;
    if (error) {
      console.warn('Grievance select with relations failed, using fallback query:', error);
      let fallbackQuery = supabase
        .from('grievances')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.userId) fallbackQuery = fallbackQuery.eq('submitted_by', filters.userId);
      if (filters?.category && filters.category !== 'ALL') fallbackQuery = fallbackQuery.eq('category', filters.category);
      if (filters?.status && filters.status !== 'ALL') fallbackQuery = fallbackQuery.eq('status', filters.status);
      if (filters?.priority && filters.priority !== 'ALL') fallbackQuery = fallbackQuery.eq('priority', filters.priority);
      if (filters?.departmentId) fallbackQuery = fallbackQuery.eq('department_id', filters.departmentId);

      const fb = await fallbackQuery;
      if (!fb.error && fb.data) {
        data = fb.data;
      } else {
        throw error;
      }
    }

    return (data || []).map((t: any) => normalizeTicket(t));
  },

  async getTicketById(idOrUid: number | string): Promise<GrievanceTicket | null> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    let query = supabase
      .from('grievances')
      .select('*, student:users!submitted_by(*), department:departments(*), assigned:users!assigned_to(*)');

    if (typeof idOrUid === 'string' && idOrUid.includes('-')) {
      if (idOrUid.startsWith('GRV-')) {
        query = query.eq('ticket_number', idOrUid);
      } else {
        query = query.eq('id', idOrUid);
      }
    } else {
      query = query.eq('id', idOrUid);
    }

    const { data, error } = await query.single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    const ticket = normalizeTicket(data);

    // Fetch conversation messages / comments
    try {
      const { data: comments, error: cErr } = await supabase
        .from('grievance_comments')
        .select('*, author:users!user_id(*)')
        .eq('grievance_id', data.id)
        .order('created_at', { ascending: true });

      if (!cErr && comments) {
        ticket.messages = comments.map((c: any) => {
          const author = c.author || {};
          const authorName =
            `${author.first_name || ''} ${author.last_name || ''}`.trim() ||
            author.username ||
            author.email ||
            'Campus Staff';

          let attachmentsList: GrievanceAttachment[] = [];
          if (c.attachments) {
            if (Array.isArray(c.attachments)) {
              attachmentsList = c.attachments;
            } else if (typeof c.attachments === 'string') {
              try {
                const parsed = JSON.parse(c.attachments);
                attachmentsList = Array.isArray(parsed) ? parsed : [parsed];
              } catch {
                attachmentsList = [{ url: c.attachments }];
              }
            }
          }

          return {
            id: c.id,
            ticket_id: c.grievance_id,
            sender_id: c.user_id,
            sender_role: author.role || 'STUDENT',
            sender_name: authorName,
            message: c.message,
            attachment_url: attachmentsList[0]?.url || undefined,
            attachments: attachmentsList,
            is_internal_note: Boolean(c.is_internal),
            created_at: c.created_at,
          };
        });
      }
    } catch (commentErr) {
      console.warn('Error fetching grievance comments:', commentErr);
    }

    return ticket;
  },

  async createTicket(payload: {
    category: GrievanceCategory;
    subcategory?: string;
    title: string;
    description: string;
    priority: GrievancePriority;
    department_id?: number;
    preferred_contact?: 'EMAIL' | 'PHONE' | 'IN_PERSON';
    reference_number?: string;
    attachment_file?: File | null;
    attachment_url?: string;
  }): Promise<GrievanceTicket> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const currentUser = await getCurrentUserOrThrow('Authentication required');
    const userId = currentUser.id;
    const ticketUid = `GRV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    let finalAttachmentUrl = payload.attachment_url || '';
    let attachmentsPayload: any = null;

    if (payload.attachment_file) {
      try {
        finalAttachmentUrl = await uploadAttachmentFile(payload.attachment_file, userId);
        attachmentsPayload = [
          {
            url: finalAttachmentUrl,
            name: payload.attachment_file.name,
            type: payload.attachment_file.type,
            size: payload.attachment_file.size,
          },
        ];
      } catch (uploadErr) {
        console.warn('Attachment upload failed, proceeding without proof:', uploadErr);
      }
    } else if (finalAttachmentUrl) {
      attachmentsPayload = [{ url: finalAttachmentUrl, name: 'Proof Attachment' }];
    }

    // 72-hour SLA deadline
    const slaDeadline = new Date(Date.now() + 72 * 3600 * 1000).toISOString();

    const { data: newTicket, error } = await supabase
      .from('grievances')
      .insert({
        ticket_number: ticketUid,
        submitted_by: userId,
        department_id: payload.department_id,
        category: payload.category,
        subcategory: payload.subcategory || null,
        title: payload.title,
        description: payload.description,
        priority: payload.priority || 'MEDIUM',
        status: 'OPEN',
        preferred_contact: payload.preferred_contact || 'EMAIL',
        reference_number: payload.reference_number || null,
        attachments: attachmentsPayload,
        sla_deadline: slaDeadline,
      })
      .select('*, student:users!submitted_by(*), department:departments(*), assigned:users!assigned_to(*)')
      .single();

    if (error) throw error;
    return normalizeTicket(newTicket);
  },

  async addReply(
    ticketId: string | number,
    message: string,
    isInternalNote = false,
    attachmentFile?: File | null,
    attachmentUrl?: string
  ): Promise<GrievanceMessage> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const currentUser = await getCurrentUserOrThrow('Authentication required');
    const userId = currentUser.id;
    let finalUrl = attachmentUrl || '';
    let attachmentsPayload: any = null;

    if (attachmentFile) {
      try {
        finalUrl = await uploadAttachmentFile(attachmentFile, userId);
        attachmentsPayload = [
          {
            url: finalUrl,
            name: attachmentFile.name,
            type: attachmentFile.type,
            size: attachmentFile.size,
          },
        ];
      } catch (err) {
        console.warn('Reply attachment upload failed:', err);
      }
    } else if (finalUrl) {
      attachmentsPayload = [{ url: finalUrl, name: 'Attachment' }];
    }

    const { data: newMsg, error } = await supabase
      .from('grievance_comments')
      .insert({
        grievance_id: ticketId,
        user_id: userId,
        message: message,
        is_internal: isInternalNote,
        attachments: attachmentsPayload,
      })
      .select('*, author:users!user_id(*)')
      .single();

    if (error) throw error;

    // Transition ticket status to IN_PROGRESS if open and answered by staff
    const { data: ticket } = await supabase
      .from('grievances')
      .select('status, submitted_by')
      .eq('id', ticketId)
      .single();

    if (ticket && userId !== ticket.submitted_by && ticket.status === 'OPEN') {
      await supabase.from('grievances').update({ status: 'IN_PROGRESS' }).eq('id', ticketId);
    }

    const author = newMsg.author || {};
    const authorName =
      `${author.first_name || ''} ${author.last_name || ''}`.trim() ||
      author.username ||
      author.email ||
      'Staff Member';

    return {
      id: newMsg.id,
      ticket_id: newMsg.grievance_id,
      sender_id: newMsg.user_id,
      sender_role: author.role || 'STUDENT',
      sender_name: authorName,
      message: newMsg.message,
      attachment_url: finalUrl || undefined,
      attachments: attachmentsPayload || undefined,
      is_internal_note: Boolean(newMsg.is_internal),
      created_at: newMsg.created_at,
    };
  },

  async updateTicketStatus(
    ticketId: string | number,
    status: GrievanceStatus,
    resolutionSummary?: string
  ): Promise<GrievanceTicket> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const updatePayload: any = {
      status,
      resolved_at: status === 'RESOLVED' || status === 'CLOSED' ? new Date().toISOString() : null,
    };

    if (resolutionSummary) {
      updatePayload.resolution_summary = resolutionSummary;
    }

    const { data, error } = await supabase
      .from('grievances')
      .update(updatePayload)
      .eq('id', ticketId)
      .select('*, student:users!submitted_by(*), department:departments(*), assigned:users!assigned_to(*)')
      .single();

    if (error) throw error;

    if (data && (status === 'RESOLVED' || status === 'CLOSED') && data.submitted_by) {
      notificationSocketService
        .dispatchToUser(data.submitted_by, {
          title: 'Grievance Resolved',
          message: `Your grievance ticket ${data.ticket_number || ''} has been resolved: ${
            resolutionSummary || 'Resolution complete.'
          }`,
          category: 'GRIEVANCE',
          priority: 'HIGH',
          deep_link: '/grievances',
        })
        .catch(() => {});
    }

    // Log audit action
    try {
      const { adminService } = await import('./adminService');
      await adminService.logAction('UPDATE_GRIEVANCE_STATUS', 'grievances', String(ticketId), null, {
        status,
        resolutionSummary,
      });
    } catch {
      // Non-critical audit log failure
    }

    return normalizeTicket(data);
  },

  async rateResolution(ticketId: string | number, rating: number, feedback?: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const { error } = await supabase
      .from('grievances')
      .update({ rating, rating_feedback: feedback || null })
      .eq('id', ticketId);

    if (error) throw error;
  },

  async assignTicket(ticketId: string | number, assignedToId: string): Promise<GrievanceTicket> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const { data, error } = await supabase
      .from('grievances')
      .update({ assigned_to: assignedToId, status: 'ASSIGNED' })
      .eq('id', ticketId)
      .select('*, student:users!submitted_by(*), department:departments(*), assigned:users!assigned_to(*)')
      .single();

    if (error) throw error;

    if (data && data.submitted_by) {
      notificationSocketService
        .dispatchToUser(data.submitted_by, {
          title: 'Grievance Ticket Assigned',
          message: `Your grievance ticket ${data.ticket_number || ''} has been assigned for review.`,
          category: 'GRIEVANCE',
          priority: 'MEDIUM',
          deep_link: '/grievances',
        })
        .catch(() => {});
    }

    try {
      const { adminService } = await import('./adminService');
      await adminService.logAction('ASSIGN_GRIEVANCE', 'grievances', String(ticketId), null, {
        assigned_to: assignedToId,
      });
    } catch {
      // Non-critical audit
    }

    return normalizeTicket(data);
  },

  async getStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    avgResolutionTimeHours: number;
  }> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const { data, error } = await supabase
      .from('grievances')
      .select('status, created_at, resolved_at');

    if (error) throw error;

    const tickets = data || [];
    const open = tickets.filter((t) => t.status === 'OPEN' || t.status === 'ASSIGNED').length;
    const inProgress = tickets.filter(
      (t) => t.status === 'IN_PROGRESS' || t.status === 'WAITING_FOR_STUDENT'
    ).length;
    const resolvedTickets = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');

    // Calculate real average resolution time
    let totalResolutionHours = 0;
    let resolvedWithTimesCount = 0;

    resolvedTickets.forEach((t) => {
      if (t.created_at && t.resolved_at) {
        const diffMs = new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime();
        const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
        totalResolutionHours += diffHours;
        resolvedWithTimesCount++;
      }
    });

    const avgResolutionTimeHours =
      resolvedWithTimesCount > 0 ? Math.round(totalResolutionHours / resolvedWithTimesCount) : 24;

    return {
      total: tickets.length,
      open,
      inProgress,
      resolved: resolvedTickets.length,
      avgResolutionTimeHours,
    };
  },
};
