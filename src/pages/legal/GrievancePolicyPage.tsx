import React, { useEffect } from 'react';
import { LegalLayout, LegalSection } from '../../layouts/LegalLayout';
import { LegalSectionBlock } from '../../components/LegalSectionBlock';
import { useBranding } from '../../context/BrandingContext';

const SECTIONS: LegalSection[] = [
  { id: 'purpose', title: 'Purpose & Guiding Principles' },
  { id: 'categories', title: 'Categories of Grievances Covered' },
  { id: 'submission-process', title: 'How to Submit a Grievance in CampusSphere' },
  { id: 'required-details', title: 'Information Required for Expedited Review' },
  { id: 'resolution-stages', title: 'Investigation & Resolution Workflow' },
  { id: 'escalation', title: 'Departmental & Administrative Escalation' },
  { id: 'service-levels', title: 'Target Timelines & Expected Communication' },
  { id: 'confidentiality', title: 'Confidentiality & Anti-Retaliation Protection' },
  { id: 'contact-channels', title: 'Support Channels & Contact Directory' },
];

export const GrievancePolicyPage: React.FC = () => {
  const { branding } = useBranding();

  useEffect(() => {
    document.title = `Grievance & Support Policy - ${branding.appName || 'CampusSphere'}`;
  }, [branding.appName]);

  return (
    <LegalLayout
      title="Grievance & Support Policy"
      subtitle={`The formal procedure for students, faculty, and staff to raise, track, and resolve academic disputes, technical faults, and administrative concerns across ${branding.institutionName || 'the University'}.`}
      lastUpdated="September 2026"
      version="1.0"
      sections={SECTIONS}
    >
      <LegalSectionBlock id="purpose" number="01" title="Purpose & Guiding Principles">
        <p>
          <strong>{branding.appName || 'CampusSphere'}</strong> provides a transparent, accountable, and auditable digital redressal framework for <strong>{branding.institutionName || 'the University'}</strong>. 
        </p>
        <p>
          Every student, instructor, and staff member has the right to fair treatment, accurate academic ledgers, and prompt resolution of legitimate concerns without fear of reprisal or bias.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="categories" number="02" title="Categories of Grievances Covered">
        <p>
          The in-app Grievance Center supports formal tracking across the following issue classifications:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-1.5">
            <h4 className="font-bold text-violet-600 dark:text-violet-400">1. Academic &amp; Attendance Disputes</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Contested lecture attendance records due to documented technical network outages, grade tabulation discrepancies on semester marksheets, or syllabus credit discrepancies.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-1.5">
            <h4 className="font-bold text-blue-600 dark:text-blue-400">2. Technical &amp; System Glitches</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Inability to scan dynamic 30s QR codes, authentication lockouts, password reset failures, document upload errors, or missing course rosters.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-1.5">
            <h4 className="font-bold text-emerald-600 dark:text-emerald-400">3. Document &amp; Certificate Vault</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Delays in faculty verification of uploaded student achievements, incorrect spelling on digital degree seals, or public verification URL discrepancies.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-1.5">
            <h4 className="font-bold text-amber-600 dark:text-amber-400">4. Administrative &amp; Fellowships</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Delays in merit-based scholarship eligibility processing, placement drive registration exclusions, or departmental batch transfer delays.
            </p>
          </div>
        </div>
      </LegalSectionBlock>

      <LegalSectionBlock id="submission-process" number="03" title="How to Submit a Grievance in CampusSphere">
        <p>
          Authenticated users should submit grievances directly through the digital platform:
        </p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Navigate to the <strong>Grievance Center</strong> (located at <code>/grievances</code> in the main dashboard navigation).
          </li>
          <li>
            Click <strong>"New Grievance"</strong> and choose the appropriate category (Academic, Technical, Administrative, Facilities, or Other).
          </li>
          <li>
            Select the priority level (Low, Medium, High, or Urgent for time-sensitive examination conflicts).
          </li>
          <li>
            Provide a clear narrative title and a detailed, factual factual description.
          </li>
          <li>
            Attach relevant supporting evidence (e.g., error screenshots, medical certificates for attendance condonation, or marked answer sheet copies).
          </li>
          <li>
            Submit the ticket. A unique <strong>Grievance Tracking UID</strong> will be generated immediately.
          </li>
        </ol>
      </LegalSectionBlock>

      <LegalSectionBlock id="required-details" number="04" title="Information Required for Expedited Review">
        <p>
          To ensure timely resolution, submissions must contain specific, verifiable details:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
          <li>Course code and subject name (e.g., CS-402 Operating Systems).</li>
          <li>Precise date and lecture session hour for attendance disputes.</li>
          <li>Name of the faculty instructor or department involved.</li>
          <li>Specific error codes or URL addresses encountered for technical bugs.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="resolution-stages" number="05" title="Investigation & Resolution Workflow">
        <p>
          Every submitted grievance undergoes a transparent four-stage lifecycle tracked directly in the user's dashboard:
        </p>
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2 text-xs sm:text-sm">
          <p><strong>1. Submitted:</strong> Ticket created, logged in system ledger, and routed to the assigned department coordinator.</p>
          <p><strong>2. Under Investigation:</strong> Coordinator reviews facts, interviews relevant instructors or technical teams, and documents findings.</p>
          <p><strong>3. Action Proposed:</strong> A formal resolution (such as an attendance correction, database sync, or grade recalculation) is proposed.</p>
          <p><strong>4. Resolved &amp; Closed:</strong> The student reviews the resolution. If satisfactory, the case is marked resolved with an audit timestamp.</p>
        </div>
      </LegalSectionBlock>

      <LegalSectionBlock id="escalation" number="06" title="Departmental & Administrative Escalation">
        <p>
          If a grievance is not addressed within established service timelines or if the proposed resolution is disputed:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Level 1 (Direct Coordinator):</strong> Subject Instructor or Department Office.</li>
          <li><strong>Level 2 (Department Head):</strong> The case automatically escalates to the Head of Department (HOD) for departmental review.</li>
          <li><strong>Level 3 (Institutional Authority):</strong> Formal appeal to the University Ombudsman or Dean of Student Affairs.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="service-levels" number="07" title="Target Timelines & Expected Communication">
        <p>
          CampusSphere targets the following turnaround standards for ticket progression:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
          <li><strong>Urgent (Exam &amp; Hall Ticket Blockers):</strong> Acknowledged within 12 business hours; initial resolution within 24–48 hours.</li>
          <li><strong>High (Grade &amp; Attendance Tabulations):</strong> Initial response within 48 hours; resolution within 5 business days.</li>
          <li><strong>General Inquiries &amp; Suggestions:</strong> Addressed within 3–7 business days.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="confidentiality" number="08" title="Confidentiality & Anti-Retaliation Protection">
        <p>
          All grievance communications are strictly confidential between the complainant, the investigating officers, and authorized university leadership. University regulations strictly forbid any retaliatory action against any student or staff member who submits a grievance in good faith.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="contact-channels" number="09" title="Support Channels & Contact Directory">
        <p>
          For urgent portal access issues or users locked out of their accounts:
        </p>
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs sm:text-sm space-y-1">
          <p><strong>Helpdesk:</strong> CampusSphere Student Help &amp; Grievance Redressal Cell</p>
          <p><strong>Support Email:</strong> <a href={`mailto:${branding.supportEmail || 'support@campussphere.edu'}`} className="text-violet-600 dark:text-violet-400 underline">{branding.supportEmail || 'support@campussphere.edu'}</a></p>
          <p><strong>Helpline:</strong> {branding.supportPhone || '+91 1800 572 8900'}</p>
          <p><strong>Office Hours:</strong> Monday – Friday, 9:00 AM – 5:00 PM</p>
        </div>
      </LegalSectionBlock>
    </LegalLayout>
  );
};
