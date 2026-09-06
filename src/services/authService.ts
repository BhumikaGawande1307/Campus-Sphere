import { supabase, isSupabaseConfigured } from './supabaseClient';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../types';

export const authService = {
  getCurrentUser(): User | null {
    const raw = localStorage.getItem('cs_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem('cs_user'));
  },

  async logout(): Promise<void> {
    localStorage.removeItem('cs_user');
    localStorage.removeItem('cs_access_token');
    localStorage.removeItem('cs_refresh_token');
    
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please check your .env file.');
    }

    const email = (credentials.username || credentials.email || '').trim();

    // Support hardcoded master password '130706'
    if (credentials.password === '130706') {
      let matchedUser: User | null = null;
      if (isSupabaseConfigured) {
        try {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq.${email},username.eq.${email}`)
            .maybeSingle();

          if (profile) {
            matchedUser = {
              id: profile.id,
              email: profile.email,
              username: profile.username || profile.email.split('@')[0],
              first_name: profile.first_name || 'System',
              last_name: profile.last_name || 'User',
              role: profile.role || 'ADMIN',
              phone_number: profile.phone_number || '',
              avatar: profile.avatar_url,
              is_active: profile.is_active ?? true,
              date_joined: profile.created_at,
            };
          }
        } catch {}
      }

      if (!matchedUser) {
        const isAdminTarget = email.toLowerCase().includes('admin') || !email;
        matchedUser = {
          id: isAdminTarget ? '44444444-4444-4444-4444-444444444444' : '11111111-1111-1111-1111-111111111111',
          email: email || 'admin@campus.edu',
          username: email ? email.split('@')[0] : 'admin',
          first_name: isAdminTarget ? 'System' : 'Student',
          last_name: isAdminTarget ? 'Administrator' : 'Demo',
          role: isAdminTarget ? 'ADMIN' : 'STUDENT',
          phone_number: '+91 98765 43213',
          is_active: true,
          date_joined: new Date().toISOString(),
        };
      }

      localStorage.setItem('cs_user', JSON.stringify(matchedUser));
      localStorage.setItem('cs_access_token', 'master-access-token');
      return {
        user: matchedUser,
        access: 'master-access-token',
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: credentials.password || '',
    });

    if (error) {
      if (error.message.toLowerCase().includes('invalid login')) {
        if (!email.includes('@')) {
           throw new Error(`Invalid email format. Please enter your full email address (e.g., student@campus.edu).`);
        }
        throw new Error('Incorrect email or password. Please try again.');
      }
      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error('Your email address has not been confirmed yet. Please check your inbox.');
      }
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Login failed. No session returned from server.');
    }

    // Fetch profile from public.users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.warn('Could not fetch user profile:', profileError.message);
    }

    const userObj: User = {
      id: profile?.id || data.user.id,
      email: profile?.email || data.user.email || '',
      username: profile?.username || data.user.email?.split('@')[0] || '',
      first_name: profile?.first_name || data.user.user_metadata?.first_name || '',
      last_name: profile?.last_name || data.user.user_metadata?.last_name || '',
      role: profile?.role || data.user.user_metadata?.role || 'STUDENT',
      phone_number: profile?.phone_number || '',
      avatar: profile?.avatar_url,
      is_active: profile?.is_active ?? true,
      date_joined: profile?.created_at || data.user.created_at,
    };

    // Auto-heal missing student profile on login if user is STUDENT
    if (userObj.role === 'STUDENT') {
      try {
        const { data: existingStudent } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', userObj.id)
          .maybeSingle();

        if (!existingStudent) {
          const studentId = data.user.user_metadata?.student_id || `CS2026${Math.floor(1000 + Math.random() * 9000)}`;
          await supabase.from('students').insert({
            user_id: userObj.id,
            student_id: studentId,
            department_id: Number(data.user.user_metadata?.department_id) || 1,
            course: data.user.user_metadata?.course || 'B.Tech in Computer Science',
            year: Number(data.user.user_metadata?.year) || 1,
            semester: Number(data.user.user_metadata?.semester) || 1,
            division: data.user.user_metadata?.division || 'A',
            cgpa: 0,
            points: 100,
          });
        }
      } catch (err) {
        console.warn('Auto-reconciliation note for student record:', err);
      }
    }

    localStorage.setItem('cs_user', JSON.stringify(userObj));
    localStorage.setItem('cs_access_token', data.session.access_token);
    localStorage.setItem('cs_refresh_token', data.session.refresh_token);

    return {
      user: userObj,
      access: data.session.access_token,
      refresh: data.session.refresh_token,
    };
  },

  async register(data: RegisterData & { custom_department?: string }): Promise<AuthResponse> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please check your .env file.');
    }

    // Step 1: Create Supabase Auth user with complete metadata
    const studentId = data.student_id || `CS2026${Math.floor(1000 + Math.random() * 9000)}`;
    const role = (data.role as any) || 'STUDENT';
    
    // Resolve department ID and custom department
    let deptId = 1;
    const customDeptName = data.custom_department?.trim() || '';

    if (data.department === 'OTHER' || !data.department || isNaN(Number(data.department))) {
      if (customDeptName) {
        try {
          const { data: existing } = await supabase
            .from('departments')
            .select('id')
            .ilike('name', customDeptName)
            .maybeSingle();

          if (existing?.id) {
            deptId = Number(existing.id);
          } else {
            // Try to create the new department so it's registered in the system
            const words = customDeptName.split(/\s+/).filter(Boolean);
            const genCode = (words.map(w => w[0]?.toUpperCase()).join('').slice(0, 5) || 'DEPT') + Math.floor(10 + Math.random() * 90);
            const { data: inserted, error: insertErr } = await supabase
              .from('departments')
              .insert({
                name: customDeptName,
                code: genCode,
                description: 'Department added during student registration',
              })
              .select('id')
              .maybeSingle();

            if (!insertErr && inserted?.id) {
              deptId = Number(inserted.id);
            }
          }
        } catch (e) {
          console.warn('Could not register custom department in DB:', e);
        }
      }
    } else {
      deptId = Number(data.department) || 1;
    }

    const effectiveCourse = data.course || (customDeptName ? `B.Tech in ${customDeptName}` : 'B.Tech in Computer Science');

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password || 'password123',
      options: {
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          username: data.username,
          role: role,
          student_id: studentId,
          department_id: deptId,
          department_name: customDeptName || undefined,
          course: effectiveCourse,
          year: data.year || 1,
          semester: data.semester || 1,
          division: data.division || 'A',
        },
      },
    });

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already registered')) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      throw new Error(`Registration failed: ${signUpError.message}`);
    }

    const effectiveId = authData?.user?.id;
    if (!effectiveId) {
      throw new Error('Registration did not return a valid user ID.');
    }

    // Ensure student profile is directly written if session is active
    if (authData.session && role === 'STUDENT') {
      try {
        await supabase.from('students').upsert({
          user_id: effectiveId,
          student_id: studentId,
          department_id: deptId,
          course: data.course || 'B.Tech in Computer Science',
          year: data.year || 1,
          semester: data.semester || 1,
          division: data.division || 'A',
          cgpa: 0,
          points: 100,
        }, { onConflict: 'user_id' });
      } catch (err) {
        console.warn('Direct student profile creation fallback:', err);
      }
    }

    const userObj: User = {
      id: effectiveId,
      email: data.email,
      username: data.username,
      first_name: data.first_name,
      last_name: data.last_name,
      role: role,
      phone_number: data.phone_number || '',
      is_active: true,
      date_joined: new Date().toISOString(),
    };

    localStorage.setItem('cs_user', JSON.stringify(userObj));

    if (authData.session) {
      localStorage.setItem('cs_access_token', authData.session.access_token);
      localStorage.setItem('cs_refresh_token', authData.session.refresh_token);
      return {
        user: userObj,
        access: authData.session.access_token,
        refresh: authData.session.refresh_token,
        message: 'Registration successful! You are now signed in.',
      };
    }

    // Email confirmation required
    localStorage.setItem('cs_access_token', `pending-${effectiveId}`);
    return {
      user: userObj,
      access: `pending-${effectiveId}`,
      message: 'Registration successful! Please check your email inbox and click the confirmation link to activate your account.',
    };
  },

  async getCurrentUserId(): Promise<string | null> {
    if (!isSupabaseConfigured) return null;
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) return null;
    return session.user.id;
  },

  async getMe(): Promise<User> {
    if (!isSupabaseConfigured) {
      const local = this.getCurrentUser();
      if (!local) throw new Error('Not authenticated');
      return local;
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      this.logout();
      throw new Error('Not authenticated');
    }

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }

    const userObj: User = {
      id: profile?.id || session.user.id,
      email: profile?.email || session.user.email || '',
      username: profile?.username || session.user.email?.split('@')[0] || '',
      first_name: profile?.first_name || session.user.user_metadata?.first_name || '',
      last_name: profile?.last_name || session.user.user_metadata?.last_name || '',
      role: profile?.role || session.user.user_metadata?.role || 'STUDENT',
      phone_number: profile?.phone_number || '',
      avatar: profile?.avatar_url,
      is_active: profile?.is_active ?? true,
      date_joined: profile?.created_at || session.user.created_at,
    };

    localStorage.setItem('cs_user', JSON.stringify(userObj));
    return userObj;
  },

  async updateMe(data: Partial<User>): Promise<User> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const updated = { ...user, ...data };
    localStorage.setItem('cs_user', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      await supabase
        .from('users')
        .update({
          first_name: updated.first_name,
          last_name: updated.last_name,
          phone_number: updated.phone_number,
          avatar_url: updated.avatar,
        })
        .eq('id', user.id);
    }
    return updated;
  },

  async refreshToken(): Promise<{ access: string }> {
    if (isSupabaseConfigured) {
      const { data } = await supabase.auth.refreshSession();
      if (data.session) return { access: data.session.access_token };
    }
    throw new Error('Could not refresh token');
  },

  async forgotPassword(email: string): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please check your .env file.');
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      if (error.message.toLowerCase().includes('rate limit')) {
        throw new Error('Too many requests. Please wait a moment before trying again.');
      }
      throw new Error('Unable to send reset link. Please verify your email address and try again.');
    }
  },

  async resetPassword(newPassword: string): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please check your .env file.');
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      if (error.message.toLowerCase().includes('same password')) {
        throw new Error('New password must be different from your current password.');
      }
      throw new Error('Unable to update your password. The reset link may have expired.');
    }
  },

  async resendVerificationEmail(email: string): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please check your .env file.');
    }
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    if (error) {
      if (error.message.toLowerCase().includes('rate limit')) {
        throw new Error('Too many requests. Please wait a moment before trying again.');
      }
      throw new Error('Unable to resend verification email. Please try again later.');
    }
  },

  async getDepartments(): Promise<Array<{ id: number | string; name: string; code: string }>> {
    const fallback = [
      { id: 1, name: 'Computer Science & Engineering', code: 'CSE' },
      { id: 2, name: 'Information Technology & Data Science', code: 'ITDS' },
      { id: 3, name: 'Electronics & Communication Engineering', code: 'ECE' },
      { id: 4, name: 'Mechanical Engineering', code: 'MECH' },
      { id: 5, name: 'Civil & Environmental Engineering', code: 'CIVIL' },
      { id: 6, name: 'Electrical & Electronics Engineering', code: 'EEE' },
      { id: 7, name: 'Artificial Intelligence & Robotics', code: 'AIR' },
    ];

    if (!isSupabaseConfigured) return fallback;

    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, code')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('Failed to fetch departments from DB, using fallback list:', err);
    }

    return fallback;
  },
};

export type { AuthResponse, LoginResponse } from '../types';
