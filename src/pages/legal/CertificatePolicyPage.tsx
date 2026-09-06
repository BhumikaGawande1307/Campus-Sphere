import React, { useEffect } from 'react';
import { LegalLayout, LegalSection } from '../../layouts/LegalLayout';
import { LegalSectionBlock } from '../../components/LegalSectionBlock';
import { useBranding } from '../../context/BrandingContext';

const SECTIONS: LegalSection[] = [
  { id: 'overview', title: 'Verification Infrastructure Overview' },
  { id: 'sha256-standard', title: 'Cryptographic SHA-256 Ledger Standard' },
  { id: 'public-verification', title: 'Public Verification Endpoint & QR Seals' },
  { id: 'privacy-boundaries', title: 'Data Privacy & Information Minimization' },
  { id: 'holder-obligations', title: 'Responsibilities of Certificate Holders' },
  { id: 'verifier-obligations', title: 'Guidance for Verifiers & Employers' },
  { id: 'revocation', title: 'Revocation, Invalidation & Audit Records' },
  { id: 'anti-fraud', title: 'Anti-Fraud Enforcement & Penalties' },
  { id: 'support-contact', title: 'Institutional Registrar & Verification Desk' },
];

export const CertificatePolicyPage: React.FC = () => {
  const { branding } = useBranding();

  useEffect(() => {
    document.title = `Certificate Verification Policy - ${branding.appName || 'CampusSphere'}`;
  }, [branding.appName]);

  return (
    <LegalLayout
      title="Certificate & Verification Policy"
      subtitle={`The official operational and cryptographic standards governing the issuance, verification, and tamper-evident auditing of academic credentials issued by ${branding.institutionName || 'the University'} on ${branding.appName || 'CampusSphere'}.`}
      lastUpdated="September 2026"
      version="1.0"
      sections={SECTIONS}
    >
      <LegalSectionBlock id="overview" number="01" title="Verification Infrastructure Overview">
        <p>
          <strong>{branding.appName || 'CampusSphere'}</strong> provides a tamper-evident digital credential infrastructure for <strong>{branding.institutionName || 'the University'}</strong>. 
        </p>
        <p>
          This policy defines how degree certifications, semester marksheets, honors awards, and extracurricular course completions are cryptographically secured, publicly verifiable by third parties, and audited against fraud.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="sha256-standard" number="02" title="Cryptographic SHA-256 Ledger Standard">
        <p>
          Every verified certificate issued through or approved within CampusSphere is registered with an immutable digital fingerprint generated using the <strong>Secure Hash Algorithm (SHA-256)</strong>:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Deterministic File Hashing:</strong> When an official marksheet or certificate PDF is generated or approved by faculty, the binary contents of the document are processed to compute a unique 64-character hexadecimal SHA-256 hash.
          </li>
          <li>
            <strong>Immutable Database Storage:</strong> The computed hash is stored permanently in the university certificate database alongside a unique alphanumeric Certificate Identification Number (e.g., <code>CS-CERT-2026-001</code>).
          </li>
          <li>
            <strong>Zero-Collision Mathematics:</strong> Even a microscopic alteration (such as changing a single letter or grade score in the PDF) creates a completely different SHA-256 hash digest, rendering any forged document immediately detectable.
          </li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="public-verification" number="03" title="Public Verification Endpoint & QR Seals">
        <p>
          To enable seamless verification by employers, postgraduate universities, background screening agencies, and government bodies:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            Every issued certificate contains an embedded, high-resolution <strong>Verification QR Code</strong>.
          </li>
          <li>
            Scanning the QR code or manually entering the Certificate UID at our public verification URL (<code>/verify/:uid</code>) queries the institutional ledger directly.
          </li>
          <li>
            Verification works <strong>publicly without requiring a login or user account</strong>, removing friction for legitimate third-party evaluators.
          </li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="privacy-boundaries" number="04" title="Data Privacy & Information Minimization">
        <p>
          While the verification endpoint is public, CampusSphere strictly adheres to privacy minimization principles:
        </p>
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2 text-xs sm:text-sm">
          <p className="font-bold text-gray-900 dark:text-white">Public Verification View Exposes Only:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
            <li>Student Legal Name</li>
            <li>Certificate Title &amp; Category (e.g., Degree Certificate, Merit Award)</li>
            <li>Issuing Department &amp; Academic Program</li>
            <li>Official Issue Date</li>
            <li>Cryptographic SHA-256 Hash Digest</li>
            <li>Current Verification Status (e.g., Verified Active, Revoked, Expired)</li>
          </ul>
          <p className="font-bold text-rose-600 dark:text-rose-400 pt-2">Never Disclosed Publicly:</p>
          <p className="text-gray-500 dark:text-gray-400">
            Student home addresses, personal phone numbers, full email addresses, date of birth, emergency contacts, or detailed internal marks are strictly withheld from public verification screens.
          </p>
        </div>
      </LegalSectionBlock>

      <LegalSectionBlock id="holder-obligations" number="05" title="Responsibilities of Certificate Holders">
        <p>
          Students and graduates awarded credentials must uphold the following standards:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Share only unaltered original digital PDFs or physical copies containing the genuine QR seal.</li>
          <li>Never attempt to copy, photoshop, or graft a valid QR seal onto an unearned or altered document.</li>
          <li>Report any unauthorized use or duplication of your certificate UID to the university registrar immediately.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="verifier-obligations" number="06" title="Guidance for Verifiers & Employers">
        <p>
          Employers, admissions committees, and background verifiers evaluating CampusSphere credentials should:
        </p>
        <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm">
          <li>Ensure the verification domain matches the official institutional host address.</li>
          <li>Verify that the status banner reads <strong>"Verified Credential"</strong> in green.</li>
          <li>Compare the calculated SHA-256 hash displayed on the verification screen against the hash of the applicant's supplied PDF file.</li>
        </ol>
      </LegalSectionBlock>

      <LegalSectionBlock id="revocation" number="07" title="Revocation, Invalidation & Audit Records">
        <p>
          A certificate status may be marked as <strong>Revoked</strong> or <strong>Invalidated</strong> if:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>The underlying degree or marks were found to have been obtained through academic fraud or examination malpractice.</li>
          <li>The credential was superseded by a corrected, re-evaluated academic transcript.</li>
          <li>The certificate was issued in administrative error.</li>
        </ul>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Once revoked, the public verification endpoint will display a prominent warning notice detailing the revocation timestamp and reason code to protect third parties.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="anti-fraud" number="08" title="Anti-Fraud Enforcement & Penalties">
        <p>
          Fabricating or altering university certificates is a serious criminal and civil offense. Any individual or third party attempting to forge cryptographic credentials will face immediate disciplinary expulsion, invalidation of all historical credits, and referral to statutory law enforcement authorities under applicable forgery and cybercrime legislation.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="support-contact" number="09" title="Institutional Registrar & Verification Desk">
        <p>
          For formal manual verification apostilles, consular degree attestations, or verification discrepancies, contact the Office of the Controller of Examinations:
        </p>
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs sm:text-sm space-y-1">
          <p><strong>Office:</strong> Office of the Controller of Examinations &amp; Academic Records</p>
          <p><strong>Institution:</strong> {branding.institutionName || 'University Administration'}</p>
          <p><strong>Email:</strong> <a href={`mailto:${branding.supportEmail || 'support@campussphere.edu'}`} className="text-violet-600 dark:text-violet-400 underline">{branding.supportEmail || 'support@campussphere.edu'}</a></p>
          <p><strong>Direct Verification Portal:</strong> <a href="/#verify" className="text-violet-600 dark:text-violet-400 underline">Public Certificate Verification Ledger</a></p>
        </div>
      </LegalSectionBlock>
    </LegalLayout>
  );
};
