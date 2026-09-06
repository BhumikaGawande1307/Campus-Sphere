import React, { useEffect } from 'react';
import { LegalLayout, LegalSection } from '../../layouts/LegalLayout';
import { LegalSectionBlock } from '../../components/LegalSectionBlock';
import { useBranding } from '../../context/BrandingContext';

const SECTIONS: LegalSection[] = [
  { id: 'introduction', title: 'Introduction & Transparent Approach' },
  { id: 'technologies-used', title: 'Storage Technologies Actually Employed' },
  { id: 'essential-vs-optional', title: 'Strictly Necessary vs. Optional Storage' },
  { id: 'no-advertising', title: 'No Advertising or Cross-Site Trackers' },
  { id: 'inventory', title: 'Itemized Local Storage Inventory' },
  { id: 'management', title: 'How to Manage or Clear Browser Storage' },
  { id: 'updates-contact', title: 'Policy Updates & Contact Information' },
];

export const CookiePolicyPage: React.FC = () => {
  const { branding } = useBranding();

  useEffect(() => {
    document.title = `Cookie Policy - ${branding.appName || 'CampusSphere'}`;
  }, [branding.appName]);

  return (
    <LegalLayout
      title="Cookie & Local Storage Policy"
      subtitle={`An honest, factual breakdown of how ${branding.appName || 'CampusSphere'} uses browser local storage and session tokens exclusively for platform functionality—with zero advertising or third-party marketing trackers.`}
      lastUpdated="September 2026"
      version="1.0"
      sections={SECTIONS}
    >
      <LegalSectionBlock id="introduction" number="01" title="Introduction & Transparent Approach">
        <p>
          This Cookie &amp; Local Storage Policy explains how <strong>{branding.appName || 'CampusSphere'}</strong> utilizes web browser storage technologies when you access our institutional portal. 
        </p>
        <p>
          We believe in complete transparency: CampusSphere is an academic operating platform, not a commercial marketing website. We do not track your activity across the internet, and we do not sell your behavioral data.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="technologies-used" number="02" title="Storage Technologies Actually Employed">
        <p>
          CampusSphere primarily utilizes modern <strong>HTML5 Web Storage (localStorage)</strong> and secure session tokens rather than intrusive tracking cookies:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>HTML5 Local Storage (localStorage):</strong> Persistent key-value storage within your own web browser. We use this strictly to remember your active login session, institutional branding settings, and draft forms so you do not lose unsaved work.
          </li>
          <li>
            <strong>Session Tokens (Supabase JWTs):</strong> Secure JSON Web Tokens stored locally to authenticate your API requests to our backend database and verify your user role without prompting you to log in on every page transition.
          </li>
          <li>
            <strong>HTTP Cookies:</strong> Minimal, secure, SameSite cookies created as necessary by our backend hosting infrastructure (Supabase) to maintain secure encrypted session handshakes.
          </li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="essential-vs-optional" number="03" title="Strictly Necessary vs. Optional Storage">
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 space-y-1">
            <h4 className="font-bold text-violet-900 dark:text-violet-300 text-sm">Strictly Necessary Storage (Always Active)</h4>
            <p className="text-xs sm:text-sm text-violet-800/90 dark:text-violet-300/80">
              Required for core platform operation: authenticating your user role, securing student and faculty sessions, remembering your institution theme, and protecting API requests against cross-site request forgery. Disabling this storage prevents the platform from functioning.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-1">
            <h4 className="font-bold text-gray-900 dark:text-gray-200 text-sm">Draft Productivity Storage (Functional)</h4>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Stores client-side draft entries (such as in-progress resume builder drafts and cached event ticket passes) entirely inside your own browser to protect against connectivity interruptions.
            </p>
          </div>
        </div>
      </LegalSectionBlock>

      <LegalSectionBlock id="no-advertising" number="04" title="No Advertising or Cross-Site Trackers">
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm space-y-1">
          <p className="font-bold">Factual Commitment on Tracking:</p>
          <ul className="list-disc pl-5 space-y-1 text-emerald-800 dark:text-emerald-300">
            <li>No Google AdSense, DoubleClick, or commercial display network cookies.</li>
            <li>No Meta / Facebook Tracking Pixels or social media tracking beacons.</li>
            <li>No cross-site data harvesting or advertising profiling scripts.</li>
            <li>No sharing of browsing history with data brokers or analytics advertisers.</li>
          </ul>
        </div>
      </LegalSectionBlock>

      <LegalSectionBlock id="inventory" number="05" title="Itemized Local Storage Inventory">
        <p>
          Below is a complete, factual inventory of every key stored by CampusSphere in your browser's <code>localStorage</code>:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <thead className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-bold">
              <tr>
                <th className="p-3 border-b border-gray-200 dark:border-gray-800">Storage Key</th>
                <th className="p-3 border-b border-gray-200 dark:border-gray-800">Classification</th>
                <th className="p-3 border-b border-gray-200 dark:border-gray-800">Technical Purpose</th>
                <th className="p-3 border-b border-gray-200 dark:border-gray-800">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-[11px]">
              <tr>
                <td className="p-3 font-bold text-violet-600 dark:text-violet-400">cs_user</td>
                <td className="p-3 font-sans">Strictly Necessary</td>
                <td className="p-3 font-sans">Caches authenticated user profile (name, role, email) for instant UI rendering.</td>
                <td className="p-3 font-sans">Until sign-out</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-violet-600 dark:text-violet-400">cs_access_token</td>
                <td className="p-3 font-sans">Strictly Necessary</td>
                <td className="p-3 font-sans">Cryptographic JWT bearer token passed to Supabase to authenticate database queries.</td>
                <td className="p-3 font-sans">Session lifetime</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-violet-600 dark:text-violet-400">cs_refresh_token</td>
                <td className="p-3 font-sans">Strictly Necessary</td>
                <td className="p-3 font-sans">Used to automatically refresh expired access tokens without interrupting your workflow.</td>
                <td className="p-3 font-sans">Until sign-out</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-violet-600 dark:text-violet-400">campussphere_branding</td>
                <td className="p-3 font-sans">Functional / UI</td>
                <td className="p-3 font-sans">Stores university logo, theme color, and institutional name to maintain uniform styling.</td>
                <td className="p-3 font-sans">Persistent</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-violet-600 dark:text-violet-400">cs_resume_data</td>
                <td className="p-3 font-sans">Functional / Draft</td>
                <td className="p-3 font-sans">Saves your in-progress student resume draft locally so your work is never lost.</td>
                <td className="p-3 font-sans">Until cleared</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-violet-600 dark:text-violet-400">cs_cached_registrations</td>
                <td className="p-3 font-sans">Functional / Offline</td>
                <td className="p-3 font-sans">Caches student event ticket codes for offline presentation at campus event gates.</td>
                <td className="p-3 font-sans">Until refreshed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </LegalSectionBlock>

      <LegalSectionBlock id="management" number="06" title="How to Manage or Clear Browser Storage">
        <p>
          You can inspect, manage, or clear stored keys at any time through your browser's Developer Tools or Settings menu:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
          <li><strong>Google Chrome &amp; Brave:</strong> Settings → Privacy and Security → Site Settings → View permissions and data stored across sites.</li>
          <li><strong>Mozilla Firefox:</strong> Settings → Privacy &amp; Security → Cookies and Site Data → Manage Data.</li>
          <li><strong>Apple Safari:</strong> Preferences → Privacy → Manage Website Data.</li>
        </ul>
        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
          Note: Clearing your browser's local storage will terminate your current active session and require you to sign in again.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="updates-contact" number="07" title="Policy Updates & Contact Information">
        <p>
          If new functional storage keys are introduced to support new academic modules, this inventory will be updated accordingly. For technical questions regarding browser storage, contact{' '}
          <a href={`mailto:${branding.supportEmail || 'support@campussphere.edu'}`} className="text-violet-600 dark:text-violet-400 underline">
            {branding.supportEmail || 'support@campussphere.edu'}
          </a>.
        </p>
      </LegalSectionBlock>
    </LegalLayout>
  );
};
