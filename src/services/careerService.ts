import { supabase, isSupabaseConfigured } from './supabaseClient';
import { JobPosting, Application, Company, JobType } from '../types';

export function deserializeJob(row: any): JobPosting {
  if (!row) return {} as JobPosting;
  let meta: any = {};
  if (row.requirements && typeof row.requirements === 'string') {
    const trimmed = row.requirements.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        meta = JSON.parse(trimmed);
      } catch {
        meta = {};
      }
    }
  }

  const companyName =
    row.company?.name ||
    meta.company_name ||
    row.company_name ||
    'Campus Partner';

  const logoUrl =
    row.company?.logo_url ||
    row.company?.logo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=6366f1&color=fff&bold=true`;

  return {
    id: row.id,
    company_id: row.company_id || undefined,
    company_name: companyName,
    company: {
      id: row.company?.id || row.company_id || 0,
      name: companyName,
      logo: logoUrl,
      website: row.company?.website || '',
      location: row.company?.location || row.location || 'Global / Remote',
      description: row.company?.description || '',
    },
    title: row.title || 'Recruitment Opening',
    job_type: (row.job_type || row.type || 'FULL_TIME') as JobType,
    stipend_salary: row.stipend_salary || row.salary_range || 'Competitive Package',
    location: row.location || 'Remote / Hybrid',
    description: row.description || '',
    requirements: meta.requirements || (meta.company_name ? '' : row.requirements) || '',
    required_skills: meta.required_skills || row.required_skills || '',
    deadline: row.deadline || '',
    min_cgpa:
      meta.min_cgpa !== undefined
        ? Number(meta.min_cgpa)
        : row.min_cgpa !== undefined
        ? Number(row.min_cgpa)
        : 7.0,
    openings:
      meta.openings !== undefined
        ? Number(meta.openings)
        : row.openings !== undefined
        ? Number(row.openings)
        : 1,
    is_active: row.is_active !== undefined ? row.is_active : true,
  };
}

export const careerService = {
  async getCompanies(): Promise<Company[]> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    const { data, error } = await supabase.from('companies').select('*').order('name');
    if (error) {
      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message.includes('find the table')
      )
        return [];
      throw error;
    }
    return (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      logo: c.logo_url || c.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=6366f1&color=fff&bold=true`,
      website: c.website,
      location: c.location,
      description: c.description,
    }));
  },

  async getJobs(params?: any): Promise<JobPosting[]> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    let query = supabase
      .from('jobs')
      .select('*, company:companies(*)')
      .order('created_at', { ascending: false });

    if (params?.job_type && params.job_type !== 'ALL') {
      query = query.or(`type.eq.${params.job_type},type.ilike.${params.job_type}`);
    }

    const { data, error } = await query;
    if (error) {
      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message.includes('find the table')
      )
        return [];
      throw error;
    }

    return (data || []).map((row: any) => deserializeJob(row));
  },

  async getMyApplications(): Promise<Application[]> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    // Get user ID from Supabase auth session or localStorage fallback
    let userId: string | null = null;
    try {
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        userId = session.session.user.id;
      }
    } catch {}

    if (!userId) {
      const localUserStr = typeof localStorage !== 'undefined' ? localStorage.getItem('cs_user') : null;
      if (localUserStr) {
        try {
          const parsed = JSON.parse(localUserStr);
          if (parsed?.id) userId = parsed.id;
        } catch {}
      }
    }

    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('applications')
      .select('*, job:jobs(*, company:companies(*)), student:users!student_id(*)')
      .eq('student_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message.includes('find the table')
      )
        return [];
      throw error;
    }

    return (data || []).map((app: any) => ({
      ...app,
      applied_at: app.created_at || app.applied_at || new Date().toISOString(),
      job: app.job ? deserializeJob(app.job) : undefined,
    })) as unknown as Application[];
  },

  async getAllApplications(): Promise<Application[]> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    const { data, error } = await supabase
      .from('applications')
      .select('*, job:jobs(*, company:companies(*)), student:users!student_id(*)')
      .order('created_at', { ascending: false });

    if (error) {
      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message.includes('find the table')
      )
        return [];
      throw error;
    }

    return (data || []).map((app: any) => ({
      ...app,
      applied_at: app.created_at || app.applied_at || new Date().toISOString(),
      job: app.job ? deserializeJob(app.job) : undefined,
    })) as unknown as Application[];
  },

  async applyJob(jobId: string | number, data: { resume_url?: string }): Promise<Application> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    // Get user ID from Supabase auth session or localStorage fallback
    let userId: string | null = null;
    try {
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        userId = session.session.user.id;
      }
    } catch {}

    if (!userId) {
      const localUserStr = typeof localStorage !== 'undefined' ? localStorage.getItem('cs_user') : null;
      if (localUserStr) {
        try {
          const parsed = JSON.parse(localUserStr);
          if (parsed?.id) userId = parsed.id;
        } catch {}
      }
    }

    if (!userId) throw new Error('You must be signed in to submit an application.');

    // Check for existing application to avoid duplicate submissions
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', Number(jobId))
      .eq('student_id', userId)
      .limit(1);

    if (existing && existing.length > 0) {
      throw new Error('You have already submitted an application for this recruitment drive.');
    }

    const { data: newApp, error } = await supabase
      .from('applications')
      .insert({
        job_id: Number(jobId),
        student_id: userId,
        resume_url: data.resume_url || 'https://vault.campus.edu/resumes/default-resume.pdf',
        status: 'APPLIED',
      })
      .select()
      .single();

    if (error) throw new Error(error.message || 'Unable to submit application.');
    return newApp as unknown as Application;
  },

  async updateApplicationStatus(id: string | number, status: string): Promise<Application> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    const { data, error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', Number(id))
      .select()
      .single();
    if (error) throw new Error(error.message || 'Failed to update application status.');
    return data as unknown as Application;
  },

  async createJobPosting(data: any): Promise<JobPosting> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const companyName = (data.company_name || data.company?.name || 'Campus Partner').trim();
    const title = (data.title || '').trim();
    if (!title) throw new Error('Job role title is required.');

    const jobType = (data.job_type || data.type || 'INTERNSHIP') as string;
    const salaryRange = (data.stipend_salary || data.salary_range || 'Competitive').trim();
    const location = (data.location || 'Remote / Hybrid').trim();
    const description = (data.description || '').trim();
    const minCgpa = Number(data.min_cgpa) || 7.0;
    const openings = Number(data.openings) || 1;
    const requiredSkills = (data.required_skills || '').trim();
    const deadline =
      data.deadline ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Check if company exists in companies table
    let companyId: number | null = data.company_id || null;
    if (!companyId && companyName) {
      try {
        const { data: matchedComp } = await supabase
          .from('companies')
          .select('id')
          .ilike('name', companyName)
          .limit(1);

        if (matchedComp && matchedComp.length > 0) {
          companyId = matchedComp[0].id;
        } else {
          // Attempt to insert company into companies table if allowed
          const { data: newComp } = await supabase
            .from('companies')
            .insert({ name: companyName })
            .select('id')
            .single();
          if (newComp?.id) {
            companyId = newComp.id;
          }
        }
      } catch {
        // Silently continue if company insertion violates RLS; company_name will still be preserved in metadata
      }
    }

    // Embed metadata in requirements payload to guarantee zero data loss
    const metadataPayload = JSON.stringify({
      company_name: companyName,
      required_skills: requiredSkills,
      min_cgpa: minCgpa,
      openings: openings,
      requirements: data.requirements || '',
    });

    const insertPayload: any = {
      title,
      type: jobType,
      salary_range: salaryRange,
      location,
      description,
      requirements: metadataPayload,
      deadline,
    };

    if (companyId) {
      insertPayload.company_id = companyId;
    }

    const { data: newJob, error } = await supabase
      .from('jobs')
      .insert(insertPayload)
      .select('*, company:companies(*)')
      .single();

    if (error) {
      console.error('Failed to create job posting:', error);
      throw new Error(error.message || 'Database rejected job posting creation.');
    }

    return deserializeJob(newJob);
  },

  async deleteJobPosting(id: string | number): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    // First clear related applications
    try {
      await supabase.from('applications').delete().eq('job_id', Number(id));
    } catch {
      // ignore
    }
    const { error } = await supabase.from('jobs').delete().eq('id', Number(id));
    if (error) throw new Error(error.message || 'Failed to delete recruitment drive.');
  },
};
