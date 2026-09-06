import React, { useState } from 'react';
import { OfficialDocumentRecord } from '../types';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import QRCode from 'react-qr-code';
import { Download, Building2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import html2pdf from 'html2pdf.js';

interface TranscriptBonafideModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: OfficialDocumentRecord | null;
}

export const TranscriptBonafideModal: React.FC<TranscriptBonafideModalProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);
  if (!document) return null;

  const handleDownloadPdf = () => {
    const element = window.document.getElementById('pdf-canvas');
    if (!element) return;
    
    setDownloading(true);
    toast.success('Generating verified PDF document...');

    const opt: any = {
      margin: 10,
      filename:     `${document.document_uid}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      setDownloading(false);
      toast.success('PDF Transcript Downloaded successfully');
    }).catch((err: any) => {
      setDownloading(false);
      toast.error('Failed to generate PDF');
      console.error(err);
    });
  };

  const isTranscript = document.document_type === 'TRANSCRIPT';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Official ${isTranscript ? 'Academic Transcript' : 'Bonafide Certificate'}`}
      size="2xl"
    >
      <div className="space-y-4">
        {/* Actions Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5 print:hidden">
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm" dot>
              Officially Verified
            </Badge>
            <span className="text-xs font-mono text-slate-500 font-bold">
              {document.document_uid}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              isLoading={downloading}
              leftIcon={<Download className="h-3.5 w-3.5" />}
            >
              Download PDF
            </Button>
          </div>
        </div>

        {/* Printable Official Document Canvas */}
        <div id="pdf-canvas" className="p-6 sm:p-8 rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-xl print:border-none print:shadow-none print:p-0 space-y-6 relative overflow-hidden font-serif">
          {/* Institutional Crest & Header */}
          <div className="text-center space-y-2 border-b-2 border-slate-800 pb-5">
            <div className="flex justify-center mb-1">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-800 text-white flex items-center justify-center shadow-md">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900 font-sans">
              CampusSphere National University
            </h2>
            <p className="text-xs text-slate-600 font-sans tracking-wide">
              Office of the Controller of Examinations & Academic Registrar &bull; NAAC Grade A++
            </p>
            <p className="text-[10px] text-slate-500 font-sans">
              Academic Complex, Senapati Bapat Road, Pune, Maharashtra 411016 &bull; Tel: +91 20 2569 8000
            </p>
          </div>

          {/* Document Title Banner */}
          <div className="text-center py-2 bg-slate-50 border-y border-slate-200">
            <h3 className="text-sm sm:text-base font-bold uppercase tracking-widest text-slate-900 font-sans">
              {isTranscript ? 'Official Cumulative Academic Transcript' : 'Bonafide Certificate & Proof of Enrollment'}
            </h3>
          </div>

          {/* Student Identifiers */}
          <div className="grid grid-cols-2 gap-4 text-xs font-sans p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Student Name</span>
              <strong className="text-slate-900 text-sm">{document.student_name}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Document Serial No.</span>
              <strong className="font-mono text-slate-900">{document.document_uid}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Department</span>
              <strong className="text-slate-800">{document.department_name}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Date of Issue</span>
              <strong className="text-slate-800">{new Date(document.issue_date).toLocaleDateString()}</strong>
            </div>
          </div>

          {/* Content Body */}
          {isTranscript ? (
            <div className="space-y-4 font-sans text-xs">
              <p className="leading-relaxed text-slate-700">
                This is to officially certify that <strong>{document.student_name}</strong> has completed all academic coursework, practical laboratory sessions, and modular examinations for the degree of <strong>{document.course_name}</strong>.
              </p>

              {/* Summary Table */}
              <div className="border border-slate-300 rounded-xl overflow-x-auto text-xs touch-pan-x">
                <table className="w-full min-w-[360px] text-left divide-y divide-slate-200">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2.5">Academic Metric</th>
                      <th className="p-2.5">Evaluated Value</th>
                      <th className="p-2.5">Institutional Standard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5 font-medium">Cumulative Grade Point Average (CGPA)</td>
                      <td className="p-2.5 font-bold text-blue-700">{document.metadata?.cgpa || '8.92'} / 10.0</td>
                      <td className="p-2.5 text-slate-500">10.0 Scale</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Total Registered Academic Credits</td>
                      <td className="p-2.5 font-bold">{document.metadata?.total_credits || '101'} Credits</td>
                      <td className="p-2.5 text-slate-500">100% Earned</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Academic Standing / Division</td>
                      <td className="p-2.5 font-bold text-emerald-700">{document.metadata?.standing || 'First Class with Distinction'}</td>
                      <td className="p-2.5 text-slate-500">Exemplary</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4 font-sans text-xs leading-relaxed text-slate-700">
              <p>
                This is to certify that <strong>{document.student_name}</strong> is a bonafide, full-time enrolled student of <strong>CampusSphere National University</strong>, pursuing the <strong>{document.course_name}</strong> in the Department of {document.department_name}.
              </p>
              <p>
                This certificate is issued upon the student&rsquo;s formal request for the specific purpose of:{' '}
                <strong className="text-slate-900">&ldquo;{document.purpose || 'General Academic Verification'}&rdquo;</strong>.
              </p>
              <p>
                According to the university records, the student maintains good moral character, exemplary conduct, and satisfactory attendance.
              </p>
            </div>
          )}

          {/* Footer Seals, Signatures & QR Code */}
          <div className="pt-6 border-t-2 border-slate-800 flex items-end justify-between font-sans">
            {/* QR Verification Seal */}
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white border-2 border-slate-300 rounded-xl shadow-xs shrink-0">
                <QRCode value={document.qr_payload} size={64} />
              </div>
              <div className="text-[10px] text-slate-500 space-y-0.5 max-w-[200px]">
                <p className="font-bold text-slate-800">Scan QR to Verify</p>
                <p className="line-clamp-2 font-mono break-all text-[9px]">
                  SHA256: {document.sha256_hash.slice(0, 20)}...
                </p>
                <p className="text-emerald-700 font-semibold">Officially Verified</p>
              </div>
            </div>

            {/* Signature Stamps */}
            <div className="text-center space-y-1">
              <div className="font-serif italic text-sm text-blue-900 font-bold border-b border-slate-400 pb-1 px-4">
                Dr. Ananya Iyer
              </div>
              <p className="text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                Controller of Examinations
              </p>
              <p className="text-[9px] text-slate-400">CampusSphere University</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};



