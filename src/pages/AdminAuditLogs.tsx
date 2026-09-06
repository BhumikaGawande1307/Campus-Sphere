import React, { useEffect, useState } from 'react';
import { adminService, AuditLog } from '../services/adminService';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAuditLogs()
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="Audit Logs" subtitle="System-wide administrative activity" />
      <Card className="p-6">
        {loading ? <p className="text-sm text-slate-500">Loading...</p> : (
          <div className="space-y-3">
            {logs.length === 0 ? <p className="text-sm text-slate-500">No logs found.</p> : logs.map(log => (
              <div key={log.id} className="p-3 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/60 dark:bg-midnight-900/60 flex items-center justify-between text-xs">
                <div>
                  <Badge variant="primary" size="sm">{log.action}</Badge>
                  <span className="ml-2 font-bold text-slate-900 dark:text-white">
                    {log.actor?.first_name || log.actor?.username || 'System'} modified {log.resource_type}
                  </span>
                </div>
                <span className="text-slate-400 font-mono">{new Date(log.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
