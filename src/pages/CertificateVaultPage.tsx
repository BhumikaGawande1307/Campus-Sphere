import React, { useEffect, useState, useCallback, useRef } from 'react';
import { certificateService } from '../services/certificateService';
import { Certificate, CertificateCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { Tabs } from '../components/Tabs';
import { Modal } from '../components/Modal';
import { Input, Select, Textarea } from '../components/Input';
import { StatCard } from '../components/StatCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { UniversalScannerModal } from '../components/UniversalScannerModal';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import QRCode from 'react-qr-code';
import {
  FileCheck,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Search,
  Plus,
  QrCode,
  Sparkles,
  Award,
  BookOpen,
  Eye,
  Trash2,
  Calendar,
  FileText,
  Clock,
  Printer,
  Camera,
  Download,
  Copy,
  LayoutGrid,
  List,
  RotateCcw,
  Building2,
  X,
  Check,
  Share2,
} from 'lucide-react';

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const CertificateVaultPage: React.FC = () => {
  const { user } = useAuth();
  const isFaculty =
    user?.role === 'FACULTY' ||
    user?.role === 'HOD' ||
    ['ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR', 'COORDINATOR'].includes(user?.role || '');

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const toast = useToast();

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [cameraScanOpen, setCameraScanOpen] = useState(false);
  const [selectedCertForView, setSelectedCertForView] = useState<Certificate | null>(null);
  const [selectedCertForQR, setSelectedCertForQR] = useState<Certificate | null>(null);
  const [reviewCert, setReviewCert] = useState<Certificate | null>(null);
  const [reviewRemark, setReviewRemark] = useState('');
  const [pointsReward, setPointsReward] = useState(50);
  const [reviewing, setReviewing] = useState(false);

  // Upload Form & Drag-and-drop state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [filePreview, setFilePreview] = useState<{ name: string; size: number; type: string; url?: string } | null>(null);
  const [uploadStage, setUploadStage] = useState('');
  const [uploading, setUploading] = useState(false);

  const [uploadForm, setUploadForm] = useState({
    title: '',
    issuer: '',
    category: 'Certification' as CertificateCategory,
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    credential_url: '',
    description: '',
    file_name: '',
    file: null as File | null,
    is_public: true,
  });

  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      issuer: '',
      category: 'Certification',
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      credential_url: '',
      description: '',
      file_name: '',
      file: null,
      is_public: true,
    });
    setFilePreview(null);
    setUploadStage('');
  };

  const fetchCertificates = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const params: any = {};
      if (activeTab !== 'ALL') params.status = activeTab;
      if (selectedCategory !== 'ALL') params.category = selectedCategory;

      const res = isFaculty
        ? await certificateService.getCertificates(params)
        : await certificateService.getMyCertificates();
      setCertificates(res);
    } catch (err: any) {
      toast.error('Failed to load credentials', err?.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategory, isFaculty, toast]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  // File selection handler
  const handleFileSelect = (file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      toast.warning('File too large', 'Please choose a document smaller than 15MB.');
      return;
    }

    let url: string | undefined = undefined;
    if (file.type.startsWith('image/')) {
      url = URL.createObjectURL(file);
    }

    setFilePreview({
      name: file.name,
      size: file.size,
      type: file.type,
      url,
    });

    setUploadForm((prev) => ({
      ...prev,
      file,
      file_name: file.name,
      // Auto-populate title if empty
      title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title.trim()) {
      toast.warning('Missing Information', 'Please provide a document title.');
      return;
    }
    if (!uploadForm.issuer.trim()) {
      toast.warning('Missing Information', 'Please provide the issuing institution or authority.');
      return;
    }

    setUploading(true);
    setUploadStage('Saving document securely...');
    try {
      await certificateService.uploadCertificate(uploadForm);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      toast.success('Document Uploaded Successfully! 🎉', 'Document is securely registered and submitted for verification.');
      setIsUploadOpen(false);
      resetUploadForm();
      fetchCertificates(false);
    } catch (err: any) {
      console.error('Document upload error:', err);
      toast.error('Upload Failed', err?.message || 'Database rejected document submission.');
    } finally {
      setUploading(false);
      setUploadStage('');
    }
  };

  const handleReviewAction = async (status: 'APPROVED' | 'REJECTED') => {
    if (!reviewCert) return;
    setReviewing(true);
    try {
      await certificateService.reviewCertificate(
        reviewCert.id,
        status,
        reviewRemark,
        pointsReward
      );
      if (status === 'APPROVED') {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      }
      toast.success(
        status === 'APPROVED' ? 'Credential Verified & Approved!' : 'Credential Rejected',
        status === 'APPROVED'
          ? `Awarded +${pointsReward} Activity Points to student profile.`
          : 'Rejection feedback sent to student.'
      );
      setReviewCert(null);
      setReviewRemark('');
      if (selectedCertForView?.id === reviewCert.id) {
        setSelectedCertForView(null);
      }
      fetchCertificates(false);
    } catch (err: any) {
      toast.error('Audit Update Failed', err?.message);
    } finally {
      setReviewing(false);
    }
  };

  const handleDeleteCertificate = async (id: number) => {
    if (!confirm('Are you sure you want to remove this document from the vault? This cannot be undone.')) return;
    try {
      await certificateService.deleteCertificate(id);
      toast.success('Document Removed', 'The credential and stored files were safely removed.');
      fetchCertificates(false);
    } catch (err: any) {
      toast.error('Failed to delete document', err?.message);
    }
  };

  const copyVerificationLink = (uid: string) => {
    const url = `${window.location.origin}/verify/${uid}`;
    navigator.clipboard.writeText(url);
    toast.success('Public Verification Link Copied', 'Shareable link copied to clipboard.');
  };

  const filteredCerts = certificates.filter((c) => {
    const titleMatch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const issuerMatch = c.issuer.toLowerCase().includes(searchQuery.toLowerCase());
    const uidMatch = c.certificate_uid.toLowerCase().includes(searchQuery.toLowerCase());
    const categoryMatch = selectedCategory === 'ALL' || c.category === selectedCategory;
    const statusMatch = activeTab === 'ALL' || c.status === activeTab;
    return (titleMatch || issuerMatch || uidMatch) && categoryMatch && statusMatch;
  });

  const verifiedCount = certificates.filter((c) => c.status === 'APPROVED').length;
  const pendingCount = certificates.filter((c) => c.status === 'PENDING').length;
  const totalPoints = certificates
    .filter((c) => c.status === 'APPROVED')
    .reduce((acc, c) => acc + (c.points_awarded || 50), 0);

  const categories: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All Documents' },
    { id: 'Certification', label: 'Technical Certifications' },
    { id: 'Academic', label: 'Academic Marksheets' },
    { id: 'Internship', label: 'Internship Proofs' },
    { id: 'Hackathon', label: 'Hackathons & Awards' },
    { id: 'Identity', label: 'Identity & Enrollment' },
    { id: 'Research', label: 'Research & Publications' },
    { id: 'Volunteering', label: 'Volunteering & NSS' },
    { id: 'Sports', label: 'Sports & Athletics' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title={isFaculty ? 'Verify Student Documents & Certificates' : 'Certificates & Documents Vault'}
        subtitle="Officially verified academic marksheets, course certificates, and achievement records"
        badge={
          <Badge variant="success" size="sm" dot>
            Verified Records Active
          </Badge>
        }
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCertificates()}
              leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              className="text-xs font-bold"
            >
              Refresh
            </Button>

            {!isFaculty && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCameraScanOpen(true)}
                  leftIcon={<Camera className="h-3.5 w-3.5 text-blue-500" />}
                  className="text-xs font-bold"
                >
                  Scan with Camera
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsUploadOpen(true)}
                  leftIcon={<Plus className="h-4 w-4" />}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                >
                  Upload Document
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Total Documents"
          value={certificates.length}
          icon={FileCheck}
          color="blue"
          subtitle="In Secure Vault"
        />
        <StatCard
          title="Verified Credentials"
          value={verifiedCount}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Officially Verified"
          trend={{ value: '100% Tamper-Proof', isPositive: true }}
          progress={certificates.length > 0 ? (verifiedCount / certificates.length) * 100 : 100}
        />
        <StatCard
          title="Pending Reviews"
          value={pendingCount}
          icon={Clock}
          color="amber"
          subtitle={isFaculty ? 'Awaiting your review' : 'Under committee review'}
        />
        <StatCard
          title="Activity Points"
          value={`+${totalPoints} pts`}
          icon={Award}
          color="purple"
          subtitle="Earned from verified credentials"
          progress={Math.min(100, Math.round((totalPoints / 250) * 100))}
        />
      </div>

      {/* Filter Toolbar & View Mode Switcher */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Tabs
            tabs={[
              { id: 'ALL', label: 'All Vault Items', count: certificates.length },
              {
                id: 'APPROVED',
                label: 'Verified Credentials',
                count: verifiedCount,
              },
              {
                id: 'PENDING',
                label: 'Pending Audit',
                count: pendingCount,
              },
              {
                id: 'REJECTED',
                label: 'Rejected',
                count: certificates.filter((c) => c.status === 'REJECTED').length,
              },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <div className="flex items-center gap-2">
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search by title, issuer, UID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-midnight-800 border border-slate-200 dark:border-white/5 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-midnight-700 text-blue-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-midnight-700 text-blue-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Category Scroll Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-midnight-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-midnight-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Documents View (Grid vs Table) */}
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : filteredCerts.length === 0 ? (
        <EmptyState
          title="No Documents Found"
          description="Upload certifications, marksheets, and internship proofs to build your tamper-evident credential profile."
          actionText={!isFaculty ? 'Upload Document' : undefined}
          onAction={() => setIsUploadOpen(true)}
        />
      ) : viewMode === 'grid' ? (
        /* Modern Card Grid */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCerts.map((cert) => {
            const isApproved = cert.status === 'APPROVED';
            const isPending = cert.status === 'PENDING';
            const docUrl = cert.file_url || cert.image_url;
            const isPdf = docUrl?.toLowerCase().includes('.pdf');

            return (
              <Card
                key={cert.id}
                hover
                glow={isApproved ? 'emerald' : isPending ? 'blue' : 'none'}
                className="flex flex-col justify-between p-5 space-y-4 relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-midnight-900/95 shadow-sm hover:shadow-xl transition-all duration-200"
              >
                {/* Subtle Ambient Corner Glow */}
                {isApproved && (
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/15 blur-xl" />
                )}

                <div className="space-y-3 relative z-10">
                  {/* Category & Status Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant={isApproved ? 'success' : isPending ? 'warning' : 'danger'}
                      size="sm"
                      dot
                    >
                      {isApproved ? 'Verified Credential' : isPending ? 'Pending Audit' : 'Rejected'}
                    </Badge>

                    <div className="flex items-center gap-1.5">
                      {isPdf ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40">
                          PDF
                        </span>
                      ) : docUrl ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                          IMG
                        </span>
                      ) : null}
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        {cert.category}
                      </span>
                    </div>
                  </div>

                  {/* Document Title & Issuer */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug line-clamp-2 hover:text-blue-600 transition-colors">
                      {cert.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{cert.issuer}</span>
                    </p>
                  </div>

                  {/* Rejection Note or Description */}
                  {cert.status === 'REJECTED' && cert.rejection_reason ? (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 space-y-0.5">
                      <span className="font-bold flex items-center gap-1 text-[11px]">
                        <AlertTriangle className="h-3 w-3" /> Audit Remarks:
                      </span>
                      <p className="italic text-[11px]">{cert.rejection_reason}</p>
                    </div>
                  ) : cert.description ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {cert.description}
                    </p>
                  ) : null}

                  {/* UID & Activity Points Strip */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <button
                      type="button"
                      onClick={() => copyVerificationLink(cert.certificate_uid)}
                      className="hover:text-blue-600 flex items-center gap-1 truncate max-w-[65%]"
                      title="Click to copy public verification link"
                    >
                      <Copy className="h-3 w-3 shrink-0" />
                      <span className="truncate">{cert.certificate_uid}</span>
                    </button>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                      +{cert.points_awarded || 50} pts
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5 relative z-10">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedCertForQR(cert)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                      title="View QR Verification Seal"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>Seal</span>
                    </button>

                    {docUrl && (
                      <a
                        href={docUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-midnight-800 transition-colors"
                        title="Download Document"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedCertForView(cert)}
                      leftIcon={<Eye className="h-3.5 w-3.5" />}
                      className="text-xs font-bold rounded-xl"
                    >
                      View
                    </Button>

                    {isFaculty ? (
                      <Button
                        size="sm"
                        onClick={() => setReviewCert(cert)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
                      >
                        Audit
                      </Button>
                    ) : (
                      <button
                        onClick={() => handleDeleteCertificate(cert.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Remove Document from Vault"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Modern Table / Ledger View */
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-midnight-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-midnight-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80 dark:border-white/5">
                <tr>
                  <th className="p-4">Document Title & Issuer</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">UID Reference</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Points</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                {filteredCerts.map((cert) => {
                  const isApproved = cert.status === 'APPROVED';
                  const isPending = cert.status === 'PENDING';
                  const docUrl = cert.file_url || cert.image_url;

                  return (
                    <tr key={cert.id} className="hover:bg-slate-50/70 dark:hover:bg-midnight-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {cert.title}
                        </div>
                        <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3 text-blue-500" />
                          <span>{cert.issuer}</span>
                          <span>•</span>
                          <span>{new Date(cert.issue_date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-midnight-800 text-slate-600 dark:text-slate-300">
                          {cert.category}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-500">
                        <button
                          type="button"
                          onClick={() => copyVerificationLink(cert.certificate_uid)}
                          className="hover:text-blue-600 flex items-center gap-1"
                          title="Click to copy link"
                        >
                          <Copy className="h-3 w-3 text-slate-400" />
                          <span>{cert.certificate_uid}</span>
                        </button>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={isApproved ? 'success' : isPending ? 'warning' : 'danger'}
                          size="sm"
                          dot
                        >
                          {isApproved ? 'Verified' : isPending ? 'Pending' : 'Rejected'}
                        </Badge>
                      </td>
                      <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                        +{cert.points_awarded || 50} pts
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedCertForView(cert)}
                            leftIcon={<Eye className="h-3.5 w-3.5" />}
                            className="text-xs font-bold rounded-xl"
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedCertForQR(cert)}
                            className="text-xs font-bold rounded-xl"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                          </Button>
                          {docUrl && (
                            <a href={docUrl} download target="_blank" rel="noreferrer">
                              <Button size="sm" variant="outline" className="rounded-xl">
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </a>
                          )}
                          {isFaculty ? (
                            <Button
                              size="sm"
                              onClick={() => setReviewCert(cert)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs"
                            >
                              Audit
                            </Button>
                          ) : (
                            <button
                              onClick={() => handleDeleteCertificate(cert.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interactive Document Viewer Modal */}
      <DocumentViewerModal
        certificate={selectedCertForView}
        isOpen={!!selectedCertForView}
        onClose={() => setSelectedCertForView(null)}
        isFaculty={isFaculty}
        onApprove={(cert) => setReviewCert(cert)}
        onReject={(cert) => setReviewCert(cert)}
      />

      {/* Official QR Verification Seal Modal */}
      <Modal
        isOpen={!!selectedCertForQR}
        onClose={() => setSelectedCertForQR(null)}
        title="Official Public Verification Seal"
        description={selectedCertForQR?.title || 'Document'}
      >
        {selectedCertForQR && (
          <div className="flex flex-col items-center justify-center p-4 space-y-5 text-center">
            <div className="p-4 rounded-3xl bg-white shadow-xl border-4 border-blue-500/20">
              <QRCode
                value={`${window.location.origin}/verify/${selectedCertForQR.certificate_uid}`}
                size={200}
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-mono text-slate-400">
                UID: {selectedCertForQR.certificate_uid}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm">
                Employers and third parties can scan this seal to verify the certificate directly against university records.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyVerificationLink(selectedCertForQR.certificate_uid)}
                leftIcon={<Copy className="h-3.5 w-3.5" />}
              >
                Copy Link
              </Button>
              <a
                href={`${window.location.origin}/verify/${selectedCertForQR.certificate_uid}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="sm" variant="secondary" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                  Open Public Verify Page
                </Button>
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* State-of-the-Art Drag & Drop Upload Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          resetUploadForm();
        }}
        title="Upload Document to Vault"
        description="Attach marksheets, course certificates, or internship letters for official verification."
        size="lg"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <Input
            label="Document Title"
            required
            value={uploadForm.title}
            onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
            placeholder="e.g. AWS Certified Solutions Architect / Semester 5 Marksheet"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Issuing Authority / Institution"
              required
              value={uploadForm.issuer}
              onChange={(e) => setUploadForm({ ...uploadForm, issuer: e.target.value })}
              placeholder="e.g. Amazon Web Services / State Examination Board"
            />
            <Select
              label="Document Category"
              value={uploadForm.category}
              onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value as CertificateCategory })}
              options={[
                { value: 'Certification', label: 'Technical Certification' },
                { value: 'Academic', label: 'Academic Marksheet / Transcript' },
                { value: 'Internship', label: 'Internship Offer / Experience Proof' },
                { value: 'Hackathon', label: 'Hackathon Win / Trophy' },
                { value: 'Identity', label: 'Identity & Enrollment Card' },
                { value: 'Research', label: 'Research Paper / Publication' },
                { value: 'Volunteering', label: 'Volunteering / NSS' },
                { value: 'Sports', label: 'Sports & Athletics' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Issue Date"
              type="date"
              required
              value={uploadForm.issue_date}
              onChange={(e) => setUploadForm({ ...uploadForm, issue_date: e.target.value })}
            />
            <Input
              label="Expiry Date (Optional)"
              type="date"
              value={uploadForm.expiry_date}
              onChange={(e) => setUploadForm({ ...uploadForm, expiry_date: e.target.value })}
            />
          </div>

          <Input
            label="Online Verification Link (Optional)"
            type="url"
            value={uploadForm.credential_url}
            onChange={(e) => setUploadForm({ ...uploadForm, credential_url: e.target.value })}
            placeholder="https://credly.com/badges/... or official issuer portal"
          />

          {/* Interactive Drag & Drop File Upload Zone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Document File (PDF or Image)
            </label>

            {filePreview ? (
              /* Selected File Card */
              <div className="flex items-center justify-between p-3.5 rounded-2xl border-2 border-blue-500/40 bg-blue-50/40 dark:bg-blue-950/20 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  {filePreview.url ? (
                    <img
                      src={filePreview.url}
                      alt="Preview"
                      className="h-12 w-12 rounded-xl object-cover border border-blue-200 shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shrink-0 text-sm shadow-sm">
                      PDF
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 dark:text-white truncate">
                      {filePreview.name}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">
                      {formatBytes(filePreview.size)} &bull; {filePreview.type || 'Document'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold"
                  >
                    Change
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilePreview(null);
                      setUploadForm((p) => ({ ...p, file: null, file_name: '' }));
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Drag & Drop Dropzone */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed text-center space-y-2 cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                    : 'border-slate-200 dark:border-white/10 hover:border-blue-400 bg-slate-50/50 dark:bg-midnight-800/40'
                }`}
              >
                <UploadCloud className={`h-9 w-9 mx-auto transition-transform ${isDragging ? 'scale-125 text-blue-600' : 'text-blue-500'}`} />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {isDragging ? 'Drop file to upload' : 'Click to upload or drag & drop'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports PDF, PNG, JPG, JPEG, WebP up to 15MB
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </div>

          <Textarea
            label="Description & Key Competencies Validated"
            value={uploadForm.description}
            onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
            placeholder="Key skills verified, coursework, or examination roll number..."
            rows={2}
          />

          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-midnight-950 border border-slate-200/70 dark:border-white/5">
            <input
              type="checkbox"
              id="isPublicCheck"
              checked={uploadForm.is_public}
              onChange={(e) => setUploadForm({ ...uploadForm, is_public: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <label htmlFor="isPublicCheck" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              Enable public QR verification seal for this certificate
            </label>
          </div>

          {uploadStage && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-2 animate-pulse">
              <Clock className="h-4 w-4 animate-spin" />
              <span>{uploadStage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-white/5">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsUploadOpen(false);
                resetUploadForm();
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading}
              isLoading={uploading}
              leftIcon={<UploadCloud className="h-4 w-4" />}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5"
            >
              {uploading ? 'Vaulting Document...' : 'Submit to Secure Vault'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Faculty Audit Dialog */}
      <Modal
        isOpen={!!reviewCert}
        onClose={() => setReviewCert(null)}
        title="Audit Student Document"
        description={reviewCert?.title || 'Audit'}
      >
        {reviewCert && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-midnight-800/60 space-y-1">
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {reviewCert.title} &bull; {reviewCert.issuer}
              </p>
              <p className="text-slate-500 font-mono">
                UID: {reviewCert.certificate_uid} &bull; Issued: {new Date(reviewCert.issue_date).toLocaleDateString()}
              </p>
            </div>

            <Input
              label="Award Activity Points (+10 to +150 pts)"
              type="number"
              value={pointsReward}
              onChange={(e) => setPointsReward(Number(e.target.value))}
            />

            <Textarea
              label="Faculty Review Remarks / Feedback"
              value={reviewRemark}
              onChange={(e) => setReviewRemark(e.target.value)}
              placeholder="e.g. Verified official marksheets against university records."
              rows={3}
            />

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleReviewAction('REJECTED')}
                disabled={reviewing}
              >
                Reject Document
              </Button>
              <Button
                size="sm"
                onClick={() => handleReviewAction('APPROVED')}
                disabled={reviewing}
                isLoading={reviewing}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Approve & Award (+{pointsReward} pts)
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Camera Document Scanner Modal */}
      <UniversalScannerModal
        isOpen={cameraScanOpen}
        onClose={() => {
          setCameraScanOpen(false);
          fetchCertificates(false);
        }}
        initialMode="document_capture"
      />
    </div>
  );
};
