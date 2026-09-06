import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { certificateService } from '../services/certificateService';
import QRCode from 'react-qr-code';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Calendar,
  Building2,
  User,
  Award,
  ArrowLeft,
  Lock,
  Camera,
  Printer,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useToast } from '../context/ToastContext';
import { UniversalScannerModal } from '../components/UniversalScannerModal';

export const PublicCertificateVerificationPage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const verify = async () => {
      if (!uid) return;
      try {
        setLoading(true);
        const res = await certificateService.verifyPublic(uid);
        setData(res);
      } catch (err: any) {
        setError(
          err.message || 'Certificate ID not found in the university verification database.'
        );
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [uid]);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyHash = () => {
    if (data?.certificate?.sha256_hash) {
      navigator.clipboard.writeText(data.certificate.sha256_hash);
      toast.success('Certificate ID Copied');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 dark:bg-midnight-950 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Lighting */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-grid-dots opacity-60" />
      <div className="pointer-events-none absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-1/3 h-96 w-96 rounded-full bg-emerald-600/20 blur-3xl" />

      <div className="relative z-10 w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Return to CampusSphere
          </Link>
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-600 text-white shadow-glow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Official Certificate Verification
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verified academic certificate record from official university database
          </p>
        </div>

        {loading ? (
          <Card className="p-8 text-center animate-pulse space-y-3">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
            <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800/60 rounded mx-auto" />
          </Card>
        ) : error || !data?.is_authentic ? (
          <Card className="p-8 text-center border-rose-200 dark:border-rose-900/50 space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Verification Failed
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {error || 'The requested verification token could not be validated.'}
              </p>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm">
                Return to Homepage
              </Button>
            </Link>
          </Card>
        ) : (
          <Card className="p-6 sm:p-8 space-y-6">
            {/* Authenticity Header Badge */}
            <div className="flex items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  Officially Verified Certificate
                </span>
              </div>
              <Badge variant="success" size="sm" dot>
                Authentic Record
              </Badge>
            </div>

            {/* Document Body */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {data.certificate.category}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {data.certificate.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Issued by: <strong className="text-slate-900 dark:text-white">{data.certificate.issuer}</strong>
                </p>
              </div>

              {/* Student Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-midnight-800/60 border border-slate-200/80 dark:border-white/5 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Student Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {data.certificate.student_name}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">University ID:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {data.certificate.student_id}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Department & Degree:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {data.certificate.course}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Issue Date:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {new Date(data.certificate.issue_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Original Document Proof Link */}
              {(data.certificate.file_url || data.certificate.image_url) && (
                <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Original Uploaded Document Proof
                    </span>
                    <span className="text-[11px] text-slate-500">
                      View authentic original document file stored in the vault
                    </span>
                  </div>
                  <a
                    href={data.certificate.file_url || data.certificate.image_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="sm" variant="primary" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                      View Original Document
                    </Button>
                  </a>
                </div>
              )}

              {/* Faculty Sign-off and Ledger Hash */}
              <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/30 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 dark:text-blue-300">
                    Faculty Verification Sign-Off:
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {data.certificate.verified_by}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 pt-1 border-t border-blue-200/40 dark:border-blue-900/20">
                  <span className="truncate max-w-[280px]">
                    SHA256: {data.certificate.sha256_hash}
                  </span>
                  <button
                    onClick={handleCopyHash}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* QR Verification Seal */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-midnight-800/60 border border-slate-200/80 dark:border-white/5">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Verification Seal QR Code
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Scan with any device to verify certificate.
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-white shadow-xs border border-slate-200 shrink-0">
                  <QRCode value={currentUrl} size={64} />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  leftIcon={<Printer className="h-3.5 w-3.5" />}
                >
                  Print Credential
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setScannerOpen(true)}
                  leftIcon={<Camera className="h-3.5 w-3.5 text-blue-500" />}
                >
                  Scan Physical QR
                </Button>
              </div>

              <Link to="/">
                <Button size="sm" className="w-full sm:w-auto">
                  Visit CampusSphere
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>

      {/* Camera QR Scanner Modal */}
      <UniversalScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        initialMode="qr_attendance"
      />
    </div>
  );
};
