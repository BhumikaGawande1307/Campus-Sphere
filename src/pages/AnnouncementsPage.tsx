import React, { useEffect, useState } from 'react';
import { announcementService } from '../services/announcementService';
import { Announcement, AnnouncementPriority, AnnouncementCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { Tabs } from '../components/Tabs';
import { Modal } from '../components/Modal';
import { Input, Select, Textarea } from '../components/Input';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { Plus, Calendar, Search } from 'lucide-react';

export const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const canCreate =
    ['ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR', 'HOD', 'FACULTY', 'COORDINATOR', 'PLACEMENT_OFFICER'].includes(user?.role || '') ||
    Boolean(user?.permissions?.includes('announcements.create'));

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'College announcement' as AnnouncementCategory,
    priority: 'NORMAL' as AnnouncementPriority,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      const res = await announcementService.getAnnouncements(params);
      setAnnouncements(res);
    } catch {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [priorityFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await announcementService.createAnnouncement(form);
      toast.success('Notice Posted', 'Announcement is now visible campus-wide.');
      setIsCreateOpen(false);
      setForm({
        title: '',
        content: '',
        category: 'College announcement',
        priority: 'NORMAL',
      });
      fetchAnnouncements();
    } catch {
      toast.error('Failed to post announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAnnouncements = announcements.filter((a) => {
    const titleMatch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    const contentMatch = a.content.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || contentMatch;
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Official Announcements & Notices"
        subtitle="College notices, examination schedules, placement alerts, and campus updates"
        action={
          canCreate ? (
            <Button
              onClick={() => setIsCreateOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Post Notice
            </Button>
          ) : undefined
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search circulars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        <Tabs
          tabs={[
            { id: 'ALL', label: 'All Notices' },
            { id: 'URGENT', label: 'Urgent' },
            { id: 'IMPORTANT', label: 'Important' },
            { id: 'NORMAL', label: 'Standard' },
          ]}
          activeTab={priorityFilter}
          onChange={setPriorityFilter}
        />
      </div>

      {/* Notices List */}
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : filteredAnnouncements.length === 0 ? (
        <EmptyState
          title="No Announcements Found"
          description="There are currently no circulars matching your active filter."
        />
      ) : (
        <div className="space-y-3.5">
          {filteredAnnouncements.map((ann) => {
            const priorityVariant =
              ann.priority === 'URGENT'
                ? 'danger'
                : ann.priority === 'IMPORTANT'
                ? 'warning'
                : 'neutral';

            return (
              <Card
                key={ann.id}
                hover
                className="p-5 space-y-3 border-slate-200/90 dark:border-slate-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={priorityVariant} size="sm" dot>
                        {ann.priority}
                      </Badge>
                      <span className="text-xs text-slate-500 font-medium">
                        {ann.category}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {ann.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(ann.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {ann.content}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Posted by:{' '}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {ann.author?.first_name ? `${ann.author.first_name} ${ann.author.last_name}` : 'Academic Dean'}
                    </strong>
                  </span>
                  <span>CampusSphere Official Circular</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Post Notice Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Post Official Notice"
        description="Publish a campus announcement visible to students and faculty."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Notice Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Schedule for Final Term Examinations 2026"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Notice Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as AnnouncementCategory })}
              options={[
                { value: 'College announcement', label: 'College Circular' },
                { value: 'Examination notice', label: 'Examination Notice' },
                { value: 'Placement announcement', label: 'Placement Alert' },
                { value: 'Event announcement', label: 'Event Notice' },
                { value: 'Department notice', label: 'Department Notice' },
              ]}
            />

            <Select
              label="Priority Level"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as AnnouncementPriority })}
              options={[
                { value: 'NORMAL', label: 'Normal' },
                { value: 'IMPORTANT', label: 'Important' },
                { value: 'URGENT', label: 'Urgent Alert' },
              ]}
            />
          </div>

          <Textarea
            label="Notice Content"
            required
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Detailed text of the circular..."
            rows={4}
          />

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Publish Circular
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
