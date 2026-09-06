import React, { useEffect, useState } from 'react';
import { mfaService } from '../services/mfaService';
import { UserMFAConfig, ActiveSession } from '../types';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';
import QRCode from 'react-qr-code';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Smartphone,
  Key,
  Laptop,
  Globe,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Copy,
  Download,
  RefreshCw,
} from 'lucide-react';

export const SecuritySettingsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [mfaStatus, setMfaStatus] = useState<{ isEnabled: boolean; config?: UserMFAConfig }>({
    isEnabled: false,
  });
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Setup Modal State
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpQrUrl, setTotpQrUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [enabling, setEnabling] = useState(false);

  const fetchSecurityData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const status = await mfaService.getMFAStatus(String(user.id));
      setMfaStatus(status);
      const activeSess = await mfaService.getActiveSessions(String(user.id));
      setSessions(activeSess);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, [user]);

  const handleStartSetup = async () => {
    if (!user) return;
    const { secret, qrUrl } = await mfaService.generateMFASecret(String(user.id), user.email);
    setTotpSecret(secret);
    setTotpQrUrl(qrUrl);
    setVerificationCode('');
    setBackupCodes([]);
    setSetupModalOpen(true);
  };

  const handleConfirmEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !verificationCode.trim()) return;

    setEnabling(true);
    try {
      const res = await mfaService.enableMFA(String(user.id), totpSecret, verificationCode.trim());
      setBackupCodes(res.backupCodes);
      confetti({ particleCount: 75, spread: 60 });
      toast.success('Two-Factor Authentication Activated! 🛡️');
      fetchSecurityData();
    } catch (err: any) {
      toast.error('Verification Failed', err.message);
    } finally {
      setEnabling(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!user || !confirm('Are you sure you want to deactivate Two-Factor Authentication?')) return;
    try {
      await mfaService.disableMFA(String(user.id));
      toast.info('Two-Factor Authentication Deactivated');
      fetchSecurityData();
    } catch {
      toast.error('Failed to disable MFA');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!user) return;
    try {
      await mfaService.revokeSession(String(user.id), sessionId);
      toast.success('Session Revoked');
      fetchSecurityData();
    } catch {
      toast.error('Failed to revoke session');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Security, Authentication & Session Controls"
        subtitle="Manage Two-Factor Authentication (TOTP), active login sessions, and password credentials"
        badge={
          <Badge variant={mfaStatus.isEnabled ? 'success' : 'warning'} size="sm" dot>
            {mfaStatus.isEnabled ? 'MFA Protected' : 'MFA Recommended'}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: MFA Setup (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${mfaStatus.isEnabled ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Two-Factor Authentication (TOTP)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Require a 6-digit dynamic passcode from Google Authenticator or Authy during login.
                  </p>
                </div>
              </div>
              <Badge variant={mfaStatus.isEnabled ? 'success' : 'neutral'} size="sm">
                {mfaStatus.isEnabled ? 'ACTIVE' : 'OFF'}
              </Badge>
            </div>

            {mfaStatus.isEnabled ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Two-Factor Authentication is currently securing your account
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-400">
                    Configured via Time-based One-Time Password (RFC 6238). Backup codes are available.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="danger" size="sm" onClick={handleDisableMFA}>
                    Deactivate Two-Factor Authentication
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Protect your academic records, grades, and documents against unauthorized access by adding an authenticator app.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartSetup}
                  leftIcon={<Key className="h-4 w-4" />}
                >
                  Enable Two-Factor Authentication
                </Button>
              </div>
            )}
          </Card>

          {/* Active Sessions & Devices */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Laptop className="h-4 w-4 text-blue-500" />
                Active Sessions & Devices
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {sessions.length} Known Devices
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {sessions.map((sess) => (
                <div key={sess.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 dark:text-white">{sess.device_name}</strong>
                      {sess.is_current && (
                        <Badge variant="success" size="sm">
                          Current Device
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      IP: {sess.ip_address} &bull; {sess.location}
                    </p>
                  </div>

                  {!sess.is_current && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeSession(sess.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Password & Policy Info (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <Card className="p-5 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-purple-500" />
              Campus Security Standards
            </h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              CampusSphere follows university data security guidelines. Faculty and administrative roles require 2FA activation before publishing grades or exporting student transcripts.
            </p>
          </Card>
        </div>
      </div>

      {/* MFA Setup Wizard Modal */}
      <Modal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        title="Set Up Two-Factor Authentication"
        size="md"
      >
        {backupCodes.length > 0 ? (
          /* Backup Codes Display */
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
              <strong className="block font-bold">Save Your Backup Recovery Codes!</strong>
              If you lose access to your authenticator app, these one-time codes are the only way to recover your account.
            </div>

            <div className="grid grid-cols-2 gap-2 p-4 rounded-2xl bg-slate-100 dark:bg-midnight-900 font-mono text-center text-xs font-bold text-slate-900 dark:text-white">
              {backupCodes.map((code, idx) => (
                <div key={idx} className="p-2 rounded-xl bg-white dark:bg-midnight-950 border border-slate-200 dark:border-white/5">
                  {code}
                </div>
              ))}
            </div>

            <Button
              className="w-full"
              variant="primary"
              size="sm"
              onClick={() => setSetupModalOpen(false)}
            >
              I Have Saved My Recovery Codes
            </Button>
          </div>
        ) : (
          /* Authenticator Scan & Verify Form */
          <form onSubmit={handleConfirmEnable} className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              1. Scan this QR code in Google Authenticator, 1Password, or Authy:
            </p>

            <div className="p-4 rounded-2xl bg-white flex justify-center border border-slate-200 shadow-xs">
              <QRCode value={totpQrUrl} size={140} />
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-slate-400 font-medium">Or enter manual secret key:</span>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-midnight-900 font-mono text-xs font-bold text-slate-900 dark:text-white">
                <span>{totpSecret}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(totpSecret);
                    toast.success('Key copied to clipboard');
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-white/5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                2. Enter 6-Digit Authenticator Passcode *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                className="w-full px-3.5 py-2 rounded-xl text-center tracking-widest font-mono text-base font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-midnight-950 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setSetupModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={enabling}
              >
                Verify & Activate MFA
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
