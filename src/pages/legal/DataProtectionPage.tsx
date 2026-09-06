import React, { useEffect } from 'react';
import { LegalLayout, LegalSection } from '../../layouts/LegalLayout';
import { LegalSectionBlock } from '../../components/LegalSectionBlock';
import { useBranding } from '../../context/BrandingContext';

const SECTIONS: LegalSection[] = [
  { id: 'governance', title: 'Data Governance Framework' },
  { id: 'categories', title: 'Categories of Personal & Academic Data' },
  { id: 'processing-bases', title: 'Lawful Grounds for Processing' },
  { id: 'access-controls', title: 'Technical Access Controls & Least Privilege' },
  { id: 'cryptographic-protection', title: 'Cryptographic Protection & Document Hashes' },
  { id: 'audit-trails', title: 'Administrative Audit Accountability' },
  { id: 'retention-principles', title: 'Storage & Retention Guidelines' },
  { id: 'rights-workflows', title: 'Data Rectification & Student Inquiries' },
  { id: 'governance-contact', title: 'Data Protection Officer & Contacts' },
];

export const DataProtectionPage: React.FC = () => {
  const { branding } = useBranding();

  useEffect(() => {
    document.title = `Data Protection Notice - ${branding.appName || 'CampusSphere'}`;
  }, [branding.appName]);

  return (
    <LegalLayout
      title="Data Protection & Privacy Notice"
      subtitle={`Technical and governance details regarding how ${branding.appName || 'CampusSphere'} implements role-based data minimization, database security, and cryptographic hashing for ${branding.institutionName || 'the Institution'}.`}
      lastUpdated="September 2026"
      version="1.0"
      sections={SECTIONS}
    >
      <LegalSectionBlock id="governance" number="01" title="Data Governance Framework">
        <p>
          This Data Protection Notice supplements our general Privacy Policy by detailing the technical architecture, access boundaries, and governance protocols enforced within <strong>{branding.appName || 'CampusSphere'}</strong> to safeguard educational data belonging to students, faculty, and administrators.
        </p>
        <p>
          Data processing is performed strictly on behalf of <strong>{branding.institutionName || 'the University'}</strong> as the primary educational authority and institutional data controller.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="categories" number="02" title="Categories of Personal & Academic Data">
        <p>
          The Platform maintains records classified into three primary sensitivity tiers:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2">
            <span className="font-bold text-violet-600 dark:text-violet-400 block uppercase tracking-wider text-[11px]">Tier 1: Identity &amp; Auth</span>
            <p className="text-gray-600 dark:text-gray-400">Name, institutional email, student/faculty ID numbers, password cryptographic hashes, and role entitlements.</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider text-[11px]">Tier 2: Academic Ledgers</span>
            <p className="text-gray-600 dark:text-gray-400">Course enrollments, dynamic QR attendance sessions, exam marks, semester GPA calculations, and credits earned.</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2">
            <span className="font-bold text-blue-600 dark:text-blue-400 block uppercase tracking-wider text-[11px]">Tier 3: Artifacts &amp; Cases</span>
            <p className="text-gray-600 dark:text-gray-400">Uploaded certificate PDFs, SHA-256 digests, grievance correspondence, and scholarship merit evaluations.</p>
          </div>
        </div>
      </LegalSectionBlock>

      <LegalSectionBlock id="processing-bases" number="03" title="Lawful Grounds for Processing">
        <p>
          Processing within CampusSphere is justified under educational authority and legitimate educational interests:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Academic Contract:</strong> Fulfilling enrollment obligations, tracking syllabus hours, and issuing verified marksheets.</li>
          <li><strong>Institutional Accreditation:</strong> Maintaining verifiable attendance rosters and grade distributions required for educational quality audits.</li>
          <li><strong>Legitimate Interests:</strong> Preventing academic fraud, detecting proxy attendance, and facilitating career placement with verified credentials.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="access-controls" number="04" title="Technical Access Controls & Least Privilege">
        <p>
          CampusSphere enforces strict Role-Based Access Control (RBAC) combined with database-level Row-Level Security (RLS):
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Users cannot read, update, or delete records outside their permitted role tier.</li>
          <li>Faculty members are restricted to the subject registers and student cohorts assigned to them for the active academic semester.</li>
          <li>Students have strictly read-only access to their personal grade records and attendance registers.</li>
          <li>Administrative privilege elevations require multi-factor verification (MFA) and generate immediate immutable log entries.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="cryptographic-protection" number="05" title="Cryptographic Protection & Document Hashes">
        <p>
          To prevent document tampering and ensure tamper-evident credentials:
        </p>
        <p>
          When students upload certificates or when official documents are issued, CampusSphere calculates a standardized <strong>SHA-256 cryptographic checksum</strong>. This hash digest is stored directly in the database ledger alongside the unique Certificate UID. Any subsequent alteration of the document file results in a hash mismatch, automatically flagging the credential as unverified.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="audit-trails" number="06" title="Administrative Audit Accountability">
        <p>
          To ensure accountability, CampusSphere records an audit trail of critical administrative activities in the <code>admin_audit_logs</code> database ledger:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
          <li>Role changes and user permission reassignments.</li>
          <li>Department allocations and course curriculum mapping.</li>
          <li>Manual attendance adjustments and override records.</li>
          <li>Certificate endorsements and status modifications.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="retention-principles" number="07" title="Storage & Retention Guidelines">
        <p>
          Educational records are preserved in compliance with university statutory guidelines. Attendance session tokens expire automatically within 30 seconds. Inactive user sessions expire upon token invalidation. Permanent graduation registers remain archived to allow lifelong verification of degrees.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="rights-workflows" number="08" title="Data Rectification & Student Inquiries">
        <p>
          Individuals wishing to review, correct, or obtain a summary of their recorded academic profile should submit a formal request via their department coordinator or the student Grievance Center. Requests involving official marksheet alterations require verification from the Board of Examinations.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="governance-contact" number="09" title="Data Protection Officer & Contacts">
        <p>
          For formal data governance inquiries, institutional audit requests, or technical security reports, contact:
        </p>
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs sm:text-sm space-y-1">
          <p><strong>Entity:</strong> Office of the Registrar &amp; Data Governance</p>
          <p><strong>Institution:</strong> {branding.institutionName || 'University Administration'}</p>
          <p><strong>Contact Email:</strong> <a href={`mailto:${branding.supportEmail || 'support@campussphere.edu'}`} className="text-violet-600 dark:text-violet-400 underline">{branding.supportEmail || 'support@campussphere.edu'}</a></p>
        </div>
      </LegalSectionBlock>
    </LegalLayout>
  );
};
