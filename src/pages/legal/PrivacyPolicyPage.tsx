import React, { useEffect } from 'react';
import { LegalLayout, LegalSection } from '../../layouts/LegalLayout';
import { LegalSectionBlock } from '../../components/LegalSectionBlock';
import { useBranding } from '../../context/BrandingContext';

const SECTIONS: LegalSection[] = [
  { id: 'overview', title: 'Overview & Institutional Scope' },
  { id: 'data-collected', title: 'Categories of Information Handled' },
  { id: 'purposes', title: 'Purposes of Data Processing' },
  { id: 'security', title: 'Data Security & Storage Architecture' },
  { id: 'role-access', title: 'Role-Based Access & Data Minimization' },
  { id: 'certificates', title: 'Document & Certificate Ledger Integrity' },
  { id: 'retention', title: 'Data Retention & Archival Principles' },
  { id: 'user-rights', title: 'User Rights & Correction Workflows' },
  { id: 'third-parties', title: 'Infrastructure & Service Providers' },
  { id: 'contact', title: 'Contact & Institutional Inquiries' },
];

export const PrivacyPolicyPage: React.FC = () => {
  const { branding } = useBranding();

  useEffect(() => {
    document.title = `Privacy Policy - ${branding.appName || 'CampusSphere'}`;
  }, [branding.appName]);

  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle={`Learn how ${branding.appName || 'CampusSphere'} collects, safeguards, and processes institutional academic data across your university journey.`}
      lastUpdated="September 2026"
      version="1.0"
      sections={SECTIONS}
    >
      <LegalSectionBlock id="overview" number="01" title="Overview & Institutional Scope">
        <p>
          This Privacy Policy outlines how the <strong>{branding.appName || 'CampusSphere'}</strong> educational platform ("the Platform"), deployed in collaboration with <strong>{branding.institutionName || 'the University'}</strong>, handles the collection, processing, storage, and safeguarding of personal, academic, and administrative information.
        </p>
        <p>
          The Platform operates as an institutional operating system serving verified students, faculty members, department heads (HODs), placement officers, and campus administrators. Use of the Platform is tied directly to your active academic enrollment or university employment.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="data-collected" number="02" title="Categories of Information Handled">
        <p>
          CampusSphere processes only the categories of data strictly necessary to provide academic management, attendance tracking, and credential verification:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Account &amp; Identity Credentials:</strong> Full name, university email address, unique student ID / employee roll number, encrypted password digest (managed via Supabase Auth), assigned system role (e.g., Student, Faculty, HOD, Admin), and optional profile image.
          </li>
          <li>
            <strong>Academic Enrollment Data:</strong> Department or branch assignment, program course (e.g., B.Tech, M.Tech), academic year, current semester, division/batch allocation, and curricular subjects.
          </li>
          <li>
            <strong>Attendance Records:</strong> Time-stamped check-in records, lecture course identifiers, session tokens, dynamic 30-second QR cryptographic session IDs, and classroom attendance status (present, late, absent, exempted).
          </li>
          <li>
            <strong>Examinations &amp; Academic Marks:</strong> Mid-term and end-term scorecards, subject grade points, cumulative grade point average (CGPA), credit hours earned, and marksheet audit history.
          </li>
          <li>
            <strong>Credential Vault &amp; Uploaded Documents:</strong> Student-uploaded marksheet PDFs, extracurricular achievements, degree certificates, faculty endorsement audit logs, and immutable SHA-256 cryptographic digests generated on file ingestion.
          </li>
          <li>
            <strong>Grievance &amp; Support Inquiries:</strong> In-app student grievance tickets, issue categories, descriptions, supporting screenshots/attachments, resolution logs, and departmental assignees.
          </li>
          <li>
            <strong>Scholarships &amp; Fellowships:</strong> Application submissions, eligibility criteria evaluations (such as verified CGPA thresholds), fellowship grant status, and administrative disbursement remarks.
          </li>
          <li>
            <strong>Session &amp; Security Audit Logs:</strong> Access timestamps, login events, multi-factor authentication (MFA) verification events, role elevation logs, and system configuration modifications.
          </li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="purposes" number="03" title="Purposes of Data Processing">
        <p>
          Information collected within CampusSphere is processed exclusively for bona fide educational and campus operations purposes:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Authenticating user access across university portals and preventing unauthorized system access.</li>
          <li>Generating real-time classroom attendance rosters and detecting proxy attendance through rotating tokens.</li>
          <li>Calculating academic standing, issuing official marksheets, and computing departmental semester metrics.</li>
          <li>Facilitating employer verification of issued academic certificates via public QR seals.</li>
          <li>Routing and resolving student grievances through structured institutional escalation workflows.</li>
          <li>Automating merit-based scholarship eligibility filters to match students with funding opportunities.</li>
          <li>Maintaining an immutable institutional audit trail for accreditation compliance (e.g., NAAC and NBA reviews).</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="security" number="04" title="Data Security & Storage Architecture">
        <p>
          CampusSphere employs robust technical and organizational measures designed to protect educational records from unauthorized access, loss, or disclosure:
        </p>
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2">
          <p className="font-semibold text-gray-900 dark:text-white">Security Controls Summary:</p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
            <li><strong>Transport Encryption:</strong> All client-to-server traffic is encrypted in transit using industry-standard TLS 1.3 / HTTPS.</li>
            <li><strong>Database Isolation &amp; RLS:</strong> The primary PostgreSQL database utilizes Supabase Row-Level Security (RLS) policies, enforcing that users can only query records explicitly granted to their authenticated role.</li>
            <li><strong>Authentication Security:</strong> Passwords are never stored in plaintext and are hashed using bcrypt/argon2 algorithms managed via Supabase Auth services. Privileged accounts require multi-factor authentication (MFA).</li>
            <li><strong>Tamper-Evident Hashing:</strong> Document vault certificates are hashed using the SHA-256 standard on upload to establish an unalterable digital fingerprint.</li>
          </ul>
        </div>
      </LegalSectionBlock>

      <LegalSectionBlock id="role-access" number="05" title="Role-Based Access & Data Minimization">
        <p>
          Data visibility is strictly restricted in accordance with the principle of least privilege:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Students:</strong> Can access only their personal attendance record, grade history, uploaded vault documents, submitted grievances, and scholarship applications.</li>
          <li><strong>Faculty Members:</strong> Can access attendance registers and marksheet rosters only for courses and divisions assigned to them by their department.</li>
          <li><strong>Department Heads (HODs):</strong> Have aggregated read access to departmental performance metrics, curriculum progress, and escalated grievances within their respective department.</li>
          <li><strong>Placement Officers:</strong> Can view verified academic profiles and resume highlights of students who have explicitly opted into placement recruitment drives.</li>
          <li><strong>System Administrators:</strong> Oversee user provisioning, department configurations, and system health while being subject to audit logging for every administrative action.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="certificates" number="06" title="Document & Certificate Ledger Integrity">
        <p>
          When academic certificates or degree credentials are issued or verified on CampusSphere:
        </p>
        <p>
          The system computes a cryptographic <strong>SHA-256 digest</strong> from the digital file content and generates a unique Certificate Identification Number (Certificate UID). This enables third-party verification through our public verification portal (<code>/verify/:uid</code>).
        </p>
        <p>
          The public verification view displays strictly limited metadata: the certificate title, issuing department, issue date, student full name, and verification status. Sensitive private data such as full email addresses, contact phone numbers, complete GPA gradebooks, or private home addresses are <strong>never</strong> exposed on public verification endpoints.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="retention" number="07" title="Data Retention & Archival Principles">
        <p>
          Academic records, attendance logs, and marksheet ledgers are retained in accordance with university academic regulations and statutory educational retention mandates. Upon student graduation, account access may transition to an alumni status while immutable graduation records remain archived to facilitate lifelong degree verification.
        </p>
        <p>
          Temporary session tokens and cached offline event registrations are cleared upon user logout or through browser storage management.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="user-rights" number="08" title="User Rights & Correction Workflows">
        <p>
          Students and faculty members have the right to inspect their personal and academic profile details. If any information (such as official name spelling, student roll number, or departmental allocation) is incorrect:
        </p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Minor profile details can be updated via the in-app <strong>Profile Settings</strong> page.</li>
          <li>Academic discrepancies (e.g., recorded grades or attendance percentages) must be submitted through the <strong>Grievance Center</strong> or directly to the Department Controller of Examinations for formal academic review.</li>
        </ol>
      </LegalSectionBlock>

      <LegalSectionBlock id="third-parties" number="09" title="Infrastructure & Service Providers">
        <p>
          CampusSphere utilizes trusted institutional cloud infrastructure to host application services and database storage. The database and authentication layers are hosted on <strong>Supabase</strong> (managed PostgreSQL with SOC-2 compliant hosting). 
        </p>
        <p>
          CampusSphere does not sell, lease, or monetize student or staff personal information to commercial advertising networks, data brokers, or third-party marketing entities.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="contact" number="10" title="Contact & Institutional Inquiries">
        <p>
          For privacy inquiries, data rectification requests, or governance compliance concerns, please contact the campus administrative office:
        </p>
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-1 text-xs sm:text-sm">
          <p><strong>Institution:</strong> {branding.institutionName || 'Campus Administration'}</p>
          <p><strong>Office:</strong> Office of Academic Records &amp; Data Governance</p>
          <p><strong>Support Email:</strong> <a href={`mailto:${branding.supportEmail || 'support@campussphere.edu'}`} className="text-violet-600 dark:text-violet-400 underline">{branding.supportEmail || 'support@campussphere.edu'}</a></p>
          <p><strong>Phone:</strong> {branding.supportPhone || '+91 1800 572 8900'}</p>
        </div>
      </LegalSectionBlock>
    </LegalLayout>
  );
};
