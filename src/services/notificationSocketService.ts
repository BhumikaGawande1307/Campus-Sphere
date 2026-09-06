import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface LiveNotificationEvent {
  id: string | number;
  title: string;
  message: string;
  category: 'ACADEMIC' | 'ATTENDANCE' | 'SCHOLARSHIP' | 'EVENT' | 'GRIEVANCE' | 'CAREER' | 'SYSTEM';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  deep_link: string;
  is_read: boolean;
  created_at: string;
}

type NotificationListener = (event: LiveNotificationEvent) => void;

class NotificationSocketService {
  private listeners: Set<NotificationListener> = new Set();
  private grievanceListeners: Set<() => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private isConnected = false;

  // Subscribe to grievance changes (e.g., new ticket inserted)
  public subscribeGrievance(listener: () => void): () => void {
    this.grievanceListeners.add(listener);
    return () => {
      this.grievanceListeners.delete(listener);
    };
  }

  private notifyGrievanceListeners() {
    this.grievanceListeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Error in grievance listener', e);
      }
    });
  }

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('cs_realtime_notifications');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data) {
            this.notifyListeners(event.data);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported in current environment', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('cs_notification_emitted', (evt: any) => {
        if (evt.detail) {
          this.notifyListeners(evt.detail);
        }
      });
    }

    this.initSupabaseRealtime();
  }

  private initSupabaseRealtime() {
    if (isSupabaseConfigured && supabase) {
      try {
        // Notifications realtime subscription
        supabase
          .channel('public:notifications')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications' },
            (payload) => {
              const item = payload.new as any;
              const formatted: LiveNotificationEvent = {
                id: item.id,
                title: item.title,
                message: item.message,
                category: (item.type || item.notification_type || 'SYSTEM').toUpperCase(),
                priority: item.priority || 'MEDIUM',
                deep_link: item.action_url || item.link || '/announcements',
                is_read: Boolean(item.is_read),
                created_at: item.created_at || new Date().toISOString(),
              };
              this.notifyListeners(formatted);
            }
          )
          .subscribe((status) => {
            this.isConnected = status === 'SUBSCRIBED';
          });

        // Grievance realtime subscription – fires on any new grievance row
        supabase
          .channel('public:grievances')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'grievances' },
            () => {
              this.notifyGrievanceListeners();
            }
          )
          .subscribe();

        // Also listen on support_tickets table (alias used in some parts of the app)
        supabase
          .channel('public:support_tickets')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'support_tickets' },
            () => {
              this.notifyGrievanceListeners();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Supabase Realtime subscription fallback', err);
      }
    } else {
      this.isConnected = true;
    }
  }

  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(notification: LiveNotificationEvent) {
    this.listeners.forEach((fn) => {
      try {
        fn(notification);
      } catch (e) {
        console.error('Error in notification listener', e);
      }
    });
  }

  public broadcast(notification: Omit<LiveNotificationEvent, 'id' | 'created_at' | 'is_read'>): LiveNotificationEvent {
    const fullEvent: LiveNotificationEvent = {
      ...notification,
      id: Date.now(),
      is_read: false,
      created_at: new Date().toISOString(),
    };

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(fullEvent);
      } catch {}
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cs_notification_emitted', { detail: fullEvent }));
    }

    // Insert into Supabase if configured
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: session }) => {
        if (session?.session?.user) {
          supabase.from('notifications').insert({
            user_id: session.session.user.id,
            title: fullEvent.title,
            message: fullEvent.message,
            type: fullEvent.category,
            action_url: fullEvent.deep_link,
            is_read: false
          }).then();
        }
      });
    }

    return fullEvent;
  }

  public async dispatchToUser(userId: string, notification: Omit<LiveNotificationEvent, 'id' | 'created_at' | 'is_read'>): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('notifications').insert({
        user_id: userId,
        title: notification.title,
        message: notification.message,
        type: notification.category,
        action_url: notification.deep_link,
        is_read: false
      });
    } catch (e) {
      console.error('Failed to dispatch notification to user', e);
    }
  }

  public async sendNotification(opts: {
    user_id: string | number;
    title: string;
    message: string;
    type?: string;
    action_url?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  }): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('notifications').insert({
        user_id: String(opts.user_id),
        title: opts.title,
        message: opts.message,
        type: opts.type || 'SYSTEM',
        action_url: opts.action_url || '/announcements',
        is_read: false
      });
    } catch (e) {
      console.error('Failed to send notification', e);
    }
  }
}

export const notificationSocketService = new NotificationSocketService();
