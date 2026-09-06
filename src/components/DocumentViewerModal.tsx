import React from 'react';
import { Certificate } from '../types';
import { Button } from './Button';
import { Badge } from './Badge';
import { useToast } from '../context/ToastContext';
import {
  Download,
  Printer,
  Copy,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  FileCheck,
  X,
  FileText,
  User,
  AlertTriangle,
  Clock,
  Maximize2,
} from 'lucide-react';

interface DocumentViewerModalProps {
  certificate: Certificate | null;
  isOpen: boolean;
  onClose: () => void;
  isFaculty?: boolean;
  onApprove?: (cert: Certificate) => void;
  onReject?: (cert: Certificate) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  certificate,
  isOpen,
  onClose,
  isFaculty,
  onApprove,
  onReject,
}) => {
  const toast = useToast();

  if (!isOpen || !certificate) return null;

  const isApproved = certificate.status === 'APPROVED';
  const isPending = certificate.status === 'PENDING';
  const isRejected = certificate.status === 'REJECTED';
  const verifyUrl = `${window.location.origin}/verify/${certificate.certificate_uid}`;

  const docUrl = certificate.file_url || certificate.image_url;
  const isPdf = docUrl ? docUrl.toLowerCase().includes('.pdf') : false;
  const isImage = docUrl ? /\.(png|jpg|jpeg|webp|gif)($|\?)/i.test(docUrl) : false;

  const studentName =
    (certificate.student as any)?.first_name
      ? `${(certificate.student as any).first_name} ${(certificate.student as any).last_name || ''}`.trim()
      : certificate.student?.user?.first_name
      ? `${certificate.student.user.first_name} ${certificate.student.user.last_name || ''}`.trim()
      : 'Enrolled Student';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    toast.success('Verification URL Copied', 'Public URL copied to clipboard.');
  };

  const handlePrint = () => {
    if (isPdf && docUrl) {
      const printWindow = window.open(docUrl, '_blank');
      printWindow?.focus();
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#0a0c16]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/90 dark:border-violet-500/15 bg-white dark:bg-midnight-900 shadow-2xl flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-midnight-950/60 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl font-black text-xs shrink-0 shadow-sm ${
              isPdf
                ? 'bg-rose-500/15 text-rose-600 border border-rose-500/20'
                : 'bg-blue-500/15 text-blue-600 border border-blue-500/20'
            }`}>
              {isPdf ? 'PDF' : isImage ? 'IMG' : <FileCheck className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  {certificate.title}
                </h3>
                <Badge
                  variant={isApproved ? 'success' : isPending ? 'warning' : 'danger'}
                  size="sm"
                  dot
                >
                  {isApproved ? 'Verified Document' : isPending ? 'Under Audit' : 'Rejected'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Building2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {certificate.issuer}
                </span>
                <span>•</span>
                <span className="font-mono text-[11px] text-slate-400">UID: {certificate.certificate_uid}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {docUrl && (
              <>
                <a href={docUrl} target="_blank" rel="noreferrer">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
                    className="text-xs font-bold px-2.5 sm:px-3"
                    title="Open Fullscreen"
                  >
                    <span className="hidden sm:inline">Open Fullscreen</span>
                  </Button>
                </a>
                <a href={docUrl} download target="_blank" rel="noreferrer">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="h-3.5 w-3.5" />}
                    className="text-xs font-bold px-2.5 sm:px-3"
                    title="Download Document"
                  >
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                </a>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              leftIcon={<Copy className="h-3.5 w-3.5" />}
              className="text-xs font-bold px-2.5 sm:px-3"
              title="Copy Public Verification Link"
            >
              <span className="hidden sm:inline">Copy Link</span>
            </Button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-midnight-800 transition-colors touch-manipulation"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Document Inspection Canvas */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/70 dark:bg-midnight-950/90 flex flex-col lg:flex-row gap-6 items-start">
          {/* Left / Center: The Original Document */}
          <div className="w-full lg:flex-1 bg-white dark:bg-midnight-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg overflow-hidden flex flex-col items-center justify-center min-h-[480px] p-2 sm:p-3">
            {docUrl ? (
              isPdf ? (
                /* Native PDF Viewer */
                <div className="w-full flex flex-col items-center">
                  <iframe
                    src={`${docUrl}#toolbar=1&navpanes=0`}
                    className="w-full h-[620px] rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white"
                    title="Original Uploaded PDF Document"
                  />
                  <div className="w-full pt-2 px-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Official Submitted PDF Document</span>
                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open in separate tab
                    </a>
                  </div>
                </div>
              ) : (
                /* High-Res Image Document Viewer */
                <div className="w-full flex flex-col items-center justify-center p-2">
                  <img
                    src={docUrl}
                    alt={certificate.title}
                    className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-md border border-slate-200 dark:border-white/10"
                  />
                  <div className="w-full pt-3 px-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Original Document Image</span>
                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View full resolution
                    </a>
                  </div>
                </div>
              )
            ) : certificate.credential_url ? (
              /* External Credential Link */
              <div className="py-20 px-6 flex flex-col items-center text-center space-y-4 max-w-md mx-auto">
                <div className="p-4 rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm">
                  <ExternalLink className="h-10 w-10" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Externally Hosted Credential
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    This document was registered via an external credential provider. You can inspect the authentic credential directly on the issuing authority portal.
                  </p>
                </div>
                <a href={certificate.credential_url} target="_blank" rel="noreferrer">
                  <Button
                    variant="primary"
                    rightIcon={<ExternalLink className="h-4 w-4" />}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    Open Issuer Verification Portal
                  </Button>
                </a>
              </div>
            ) : (
              /* Missing Document Fallback */
              <div className="py-20 px-6 flex flex-col items-center text-center space-y-3">
                <FileText className="h-12 w-12 text-slate-300" />
                <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                  No File Attached
                </h4>
                <p className="text-xs text-slate-400 max-w-xs">
                  This credential does not have an attached PDF or image file.
                </p>
              </div>
            )}
          </div>

          {/* Right: Authentic Document Metadata & Audit Panel */}
          <div className="w-full lg:w-80 space-y-4 shrink-0 text-xs">
            {/* Verification Status Banner */}
            {isApproved ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-black">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Verified by Academic Faculty</span>
                </div>
                <p className="text-emerald-800/90 dark:text-emerald-300/90 text-[11px] leading-relaxed">
                  This document has been audited and approved against institutional records.
                </p>
                <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  <span>Activity Reward:</span>
                  <span className="font-mono font-black">+{certificate.points_awarded || 50} pts</span>
                </div>
              </div>
            ) : isPending ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>Pending Faculty Review</span>
                </div>
                <p className="text-amber-800/90 dark:text-amber-300/90 text-[11px] leading-relaxed">
                  This document is in the institutional audit queue awaiting faculty inspection.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-1.5">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-black">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Audit Rejected</span>
                </div>
                {certificate.rejection_reason && (
                  <p className="text-rose-800/90 dark:text-rose-300/90 text-[11px] italic leading-relaxed">
                    "{certificate.rejection_reason}"
                  </p>
                )}
              </div>
            )}

            {/* Document Details Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-midnight-900 border border-slate-200/80 dark:border-white/10 space-y-3 shadow-sm">
              <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-400">
                <FileCheck className="h-3.5 w-3.5 text-blue-500" />
                Document Metadata
              </h4>

              <div className="space-y-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Category</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {certificate.category}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Issuing Authority</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {certificate.issuer}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Issue Date</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(certificate.issue_date).toLocaleDateString()}
                    </span>
                  </div>
                  {certificate.expiry_date && (
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Expiry Date</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {new Date(certificate.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Student Holder</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {studentName}
                  </span>
                </div>

                {certificate.description && (
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Competencies / Notes</span>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed mt-0.5 bg-slate-50 dark:bg-midnight-950 p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
                      {certificate.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Reference Info */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-midnight-950 border border-slate-200/70 dark:border-white/5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                <span>Verification Reference ID</span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 break-all select-all">
                {certificate.certificate_uid}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-midnight-950/60">
          <a
            href={verifyUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Verify Certificate Online</span>
          </a>

          <div className="flex items-center gap-2">
            {isFaculty && isPending && (
              <>
                {onReject && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onReject(certificate)}
                    className="text-xs font-bold rounded-xl"
                  >
                    Reject Document
                  </Button>
                )}
                {onApprove && (
                  <Button
                    size="sm"
                    onClick={() => onApprove(certificate)}
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Approve Document
                  </Button>
                )}
              </>
            )}
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs font-bold">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
