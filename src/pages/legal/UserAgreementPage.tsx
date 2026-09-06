import React, { useEffect } from 'react';
import { LegalLayout, LegalSection } from '../../layouts/LegalLayout';
import { LegalSectionBlock } from '../../components/LegalSectionBlock';
import { useBranding } from '../../context/BrandingContext';

const SECTIONS: LegalSection[] = [
  { id: 'purpose', title: 'Purpose & Operational Scope' },
  { id: 'personas', title: 'User Roles & Authorized Boundaries' },
  { id: 'core-rules', title: 'Core Rules of Acceptable Use' },
  { id: 'attendance-integrity', title: 'Attendance Integrity & Anti-Proxy Rules' },
  { id: 'document-standards', title: 'Document Vault & Credential Ethics' },
  { id: 'communication', title: 'Grievances & Official Communications' },
  { id: 'system-security', title: 'System Security & Technical Prohibitions' },
  { id: 'audit-logging', title: 'Audit Trails & Automated Verification' },
  { id: 'enforcement', title: 'Violations & Institutional Sanctions' },
];

export const UserAgreementPage: React.FC = () => {
  const { branding } = useBranding();

  useEffect(() => {
    document.title = `User Agreement - ${branding.appName || 'CampusSphere'}`;
  }, [branding.appName]);

  return (
    <LegalLayout
      title="User Agreement & Acceptable Use"
      subtitle={`Clear standards of conduct, academic integrity, and operational rules for every student, instructor, and staff member using ${branding.appName || 'CampusSphere'}.`}
      lastUpdated="September 2026"
      version="1.0"
      sections={SECTIONS}
    >
      <LegalSectionBlock id="purpose" number="01" title="Purpose & Operational Scope">
        <p>
          This User Agreement and Acceptable Use Policy ("Agreement") defines the standards of conduct required of every individual accessing the <strong>{branding.appName || 'CampusSphere'}</strong> platform. 
        </p>
        <p>
          The integrity of academic evaluations, attendance tracking, and degree certifications depends upon the honest and ethical participation of all campus community members. By accessing the Platform, you pledge to uphold these standards.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="personas" number="02" title="User Roles & Authorized Boundaries">
        <p>
          Users must operate strictly within the permissions and functional boundaries granted to their assigned institutional role:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Students:</strong> Must submit genuine personal attendance, manage their own academic documents, and access only courses in which they are officially enrolled.</li>
          <li><strong>Faculty &amp; Instructors:</strong> Must accurately initiate lecture check-in sessions, review student vault submissions impartially, and record academic evaluations truthfully.</li>
          <li><strong>Department Heads (HODs):</strong> Must oversee departmental curriculum and faculty assignments strictly for official accreditation and departmental administration.</li>
          <li><strong>Placement Officers:</strong> Must handle student resumes and placement records confidentially and share them only with verified prospective employer partners.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="core-rules" number="03" title="Core Rules of Acceptable Use">
        <p>
          Every user must adhere to the following principles of platform behavior:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Treat fellow students, faculty, and administrative staff with professional courtesy in all written submissions and communications.</li>
          <li>Maintain the privacy of personal and academic data encountered while using the Platform.</li>
          <li>Never impersonate another student, faculty member, or university official.</li>
          <li>Never exploit an unintentional software bug or display glitch to obtain unauthorized access or unfair academic advantage.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="attendance-integrity" number="04" title="Attendance Integrity & Anti-Proxy Rules">
        <p>
          CampusSphere employs dynamic 30-second rotating cryptographic QR tokens to ensure genuine classroom presence. The following acts constitute serious academic integrity violations:
        </p>
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-2 text-xs sm:text-sm">
          <p className="font-bold text-rose-900 dark:text-rose-200">Strictly Prohibited Attendance Conduct:</p>
          <ul className="list-disc pl-5 space-y-1 text-rose-800 dark:text-rose-300">
            <li>Taking a screenshot, photograph, or screen recording of an active classroom QR session to distribute to absent students.</li>
            <li>Scanning a forwarded QR code while not physically present in the designated lecture hall or classroom.</li>
            <li>Providing your credentials to a peer to check in on your behalf.</li>
            <li>Manipulating device system clocks, GPS location emulators, or cellular network parameters to defeat session validation.</li>
          </ul>
        </div>
      </LegalSectionBlock>

      <LegalSectionBlock id="document-standards" number="05" title="Document Vault & Credential Ethics">
        <p>
          The Document Vault enables students to preserve certificates and academic achievements verified by faculty. When uploading documents:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>You must upload only authentic, unmanipulated digital copies of certificates, marksheets, and licenses legitimately awarded to you.</li>
          <li>Altering grades, dates, institution names, or seals on a PDF before upload is a severe offense that triggers automated ledger hash mismatch flags.</li>
          <li>Faculty verifiers must rigorously inspect supporting materials before endorsing credentials.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="communication" number="06" title="Grievances & Official Communications">
        <p>
          The in-app Grievance Center is designed to resolve legitimate academic, technical, or administrative concerns. Users must:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide accurate, factual accounts supported by relevant dates, course codes, and documentation.</li>
          <li>Avoid filing frivolous, duplicate, or vexatious complaints intended to harass faculty members or staff.</li>
          <li>Refrain from using defamatory, obscene, or threatening language in complaint descriptions or comments.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="system-security" number="07" title="System Security & Technical Prohibitions">
        <p>
          To protect institutional data security, users shall not:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Attempt to decompile, reverse-engineer, or probe API endpoints for vulnerabilities without explicit administrative authorization.</li>
          <li>Introduce malware, viruses, worms, or malicious scripts into file upload fields.</li>
          <li>Perform automated load testing, denial-of-service simulations, or high-frequency automated requests against university servers.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="audit-logging" number="08" title="Audit Trails & Automated Verification">
        <p>
          CampusSphere automatically maintains tamper-evident audit logs (including timestamps, user IDs, client IP metadata, and modified record fields) for critical events such as attendance session creation, grade alterations, certificate status endorsements, and role modifications. These logs serve as official evidence in administrative integrity proceedings.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="enforcement" number="09" title="Violations & Institutional Sanctions">
        <p>
          Breaches of this Agreement are subject to formal inquiry by <strong>{branding.institutionName || 'the University'}</strong>. Confirmed infractions may result in:
        </p>
        <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm">
          <li>Temporary or permanent revocation of CampusSphere portal access.</li>
          <li>Nullification of fraudulent attendance records or revoked certificate approvals.</li>
          <li>Referral to the University Academic Disciplinary Committee for official disciplinary sanctions, suspension, or expulsion under institutional statutes.</li>
        </ol>
      </LegalSectionBlock>
    </LegalLayout>
  );
};
