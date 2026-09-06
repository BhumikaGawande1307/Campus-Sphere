import React, { useEffect } from 'react';
import { LegalLayout, LegalSection } from '../../layouts/LegalLayout';
import { LegalSectionBlock } from '../../components/LegalSectionBlock';
import { useBranding } from '../../context/BrandingContext';

const SECTIONS: LegalSection[] = [
  { id: 'acceptance', title: 'Acceptance of Terms & Eligibility' },
  { id: 'accounts', title: 'User Accounts & Credential Security' },
  { id: 'accuracy', title: 'Information Accuracy & Academic Honor Code' },
  { id: 'acceptable-use', title: 'Authorized Academic Use' },
  { id: 'prohibited', title: 'Prohibited Conduct & Anti-Tampering' },
  { id: 'intellectual-property', title: 'Intellectual Property & Courseware' },
  { id: 'availability', title: 'Platform Availability & Maintenance' },
  { id: 'suspension', title: 'Account Suspension & Disciplinary Action' },
  { id: 'liability', title: 'Limitation of Institutional Liability' },
  { id: 'amendments', title: 'Amendments & Administrative Contact' },
];

export const TermsPage: React.FC = () => {
  const { branding } = useBranding();

  useEffect(() => {
    document.title = `Terms & Conditions - ${branding.appName || 'CampusSphere'}`;
  }, [branding.appName]);

  return (
    <LegalLayout
      title="Terms of Use"
      subtitle={`The legal and operational terms governing your access to the ${branding.appName || 'CampusSphere'} university platform.`}
      lastUpdated="September 2026"
      version="1.0"
      sections={SECTIONS}
    >
      <LegalSectionBlock id="acceptance" number="01" title="Acceptance of Terms & Eligibility">
        <p>
          By creating an account, logging into, or accessing the <strong>{branding.appName || 'CampusSphere'}</strong> platform ("the Platform"), you agree to be bound by these Terms &amp; Conditions ("Terms"). If you do not agree to these Terms, you may not access or use the Platform.
        </p>
        <p>
          Eligibility to access the Platform is restricted to officially enrolled students, appointed faculty members, academic department staff, and authorized administrative officers of <strong>{branding.institutionName || 'the University'}</strong>.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="accounts" number="02" title="User Accounts & Credential Security">
        <p>
          Your user account is individual and non-transferable. You are solely responsible for safeguarding your login credentials (username, email address, password, and multi-factor authentication tokens).
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>You must never disclose your password or session tokens to any third party.</li>
          <li>You must immediately report any suspected unauthorized access or compromised credentials to the campus IT department.</li>
          <li>Sharing accounts between students or instructors is strictly prohibited and constitutes a direct breach of university policy.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="accuracy" number="03" title="Information Accuracy & Academic Honor Code">
        <p>
          All information provided during student enrollment, course registration, profile setup, and scholarship applications must be accurate, complete, and current. Submitting false names, altered student identification numbers, fraudulent transcripts, or forged certificate credentials represents academic misconduct punishable under the university honor code.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="acceptable-use" number="04" title="Authorized Academic Use">
        <p>
          CampusSphere is provided solely to support university education, classroom operations, faculty administration, and career development. Authorized activities include:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Scanning active classroom QR codes to mark genuine personal attendance in registered lectures.</li>
          <li>Reviewing marks, grade reports, syllabus progress, and official announcements.</li>
          <li>Uploading authentic academic certificates to the Document Vault for cryptographic verification.</li>
          <li>Submitting bona fide grievances and tracking resolution through the Grievance Center.</li>
          <li>Applying for institutional fellowships and verified corporate recruitment drives.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="prohibited" number="05" title="Prohibited Conduct & Anti-Tampering">
        <p>
          When using CampusSphere, users are strictly prohibited from engaging in any of the following actions:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-rose-900 dark:text-rose-200">
          <li>
            <strong>Attendance Proxy Submission:</strong> Sharing, screenshotting, broadcasting, or transmitting rotating dynamic 30-second QR codes to individuals outside the classroom.
          </li>
          <li>
            <strong>Location &amp; Geofence Spoofing:</strong> Utilizing mock GPS software, VPN tunnels, or virtual proxies to falsify geographic presence during attendance check-ins.
          </li>
          <li>
            <strong>Document Falsification:</strong> Uploading digitally altered or forged marksheet PDFs or attempting to manipulate SHA-256 ledger checksums.
          </li>
          <li>
            <strong>Unauthorized Privilege Elevation:</strong> Attempting to bypass role-based access control (RBAC), intercept administrative API endpoints, or view other users' private data.
          </li>
          <li>
            <strong>Automated Scraping &amp; Denial of Service:</strong> Deploying automated bots, crawlers, stress-testing scripts, or malicious payloads against the application or database.
          </li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="intellectual-property" number="06" title="Intellectual Property & Courseware">
        <p>
          The CampusSphere user interface, logo, workflow software, cryptographic hashing implementations, and visual assets are proprietary properties protected by copyright. Academic lecture materials, syllabus documents, and exam questions uploaded by faculty members remain the intellectual property of their respective creators or the university.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="availability" number="07" title="Platform Availability & Maintenance">
        <p>
          While CampusSphere strives for continuous platform availability (targeting high uptime), access may occasionally be interrupted for scheduled software updates, emergency database patches, or infrastructure maintenance. Where feasible, system administrators will publish advance announcements via the platform announcement banner.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="suspension" number="08" title="Account Suspension & Disciplinary Action">
        <p>
          The university administration reserves the right to immediately suspend, restrict, or terminate account access for any user found to have violated these Terms or university disciplinary regulations. Violations involving forged certificates, attendance fraud, or unauthorized data access will be referred to the Academic Disciplinary Committee for statutory inquiry.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="liability" number="09" title="Limitation of Institutional Liability">
        <p>
          To the extent permitted by applicable law, the Platform and its operators shall not be liable for any indirect, incidental, or consequential damages resulting from user error (e.g., lost credentials, unread deadline alerts, or failed attendance submission due to personal device network failures). Official grade decisions and degree awards remain under the sole jurisdiction of the University Controller of Examinations.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="amendments" number="10" title="Amendments & Administrative Contact">
        <p>
          These Terms may be revised periodically to reflect enhancements in university policies or software capabilities. Continued use of the Platform after revisions constitutes acceptance of the updated Terms.
        </p>
        <p>
          For legal inquiries regarding these Terms, contact the Office of Academic Administration at{' '}
          <a href={`mailto:${branding.supportEmail || 'support@campussphere.edu'}`} className="text-violet-600 dark:text-violet-400 underline">
            {branding.supportEmail || 'support@campussphere.edu'}
          </a>.
        </p>
      </LegalSectionBlock>
    </LegalLayout>
  );
};
