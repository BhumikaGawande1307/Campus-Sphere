import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

export interface BrandingSettings {
  appName: string;
  shortName: string;
  tagline: string;
  institutionName: string;
  supportEmail: string;
  supportPhone: string;
  brandColor: string;
}

export const DEFAULT_BRANDING: BrandingSettings = {
  appName: 'CampusSphere',
  shortName: 'Campus',
  tagline: 'Next-Gen University Operating System',
  institutionName: 'State Institute of Technology',
  supportEmail: 'support@campussphere.edu',
  supportPhone: '+91 1800 572 8900',
  brandColor: 'blue',
};

const STORAGE_KEY = 'cs_institution_branding';

interface BrandingContextType {
  branding: BrandingSettings;
  updateBranding: (newSettings: Partial<BrandingSettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  renderBrandName: (className?: string, highlightClass?: string) => React.ReactNode;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_BRANDING, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse branding from localStorage:', e);
    }
    return DEFAULT_BRANDING;
  });

  // Sync document title
  useEffect(() => {
    document.title = `${branding.appName} - University Operating System`;
  }, [branding.appName]);

  // Load from backend if available
  useEffect(() => {
    let mounted = true;
    adminService.getSiteSettings()
      .then((settings) => {
        if (!mounted) return;
        if (settings?.branding_config && typeof settings.branding_config === 'object') {
          setBranding((prev) => {
            const updated = { ...prev, ...settings.branding_config };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
          });
        } else if (settings?.faqs) {
          const brandFaq = settings.faqs.find((f: any) => f.question === '__BRANDING__');
          if (brandFaq?.answer) {
            try {
              const parsed = JSON.parse(brandFaq.answer);
              setBranding((prev) => {
                const updated = { ...prev, ...parsed };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
              });
            } catch (e) {
              console.warn('Failed to parse remote branding:', e);
            }
          }
        }
      })
      .catch(() => {
        // Silently fallback to localStorage
      });

    // Listen to custom cross-tab or cross-component branding events
    const handleBrandingEvent = (e: Event) => {
      const customEvent = e as CustomEvent<BrandingSettings>;
      if (customEvent.detail) {
        setBranding(customEvent.detail);
      }
    };

    window.addEventListener('campus:branding_updated', handleBrandingEvent);
    return () => {
      mounted = false;
      window.removeEventListener('campus:branding_updated', handleBrandingEvent);
    };
  }, []);

  const updateBranding = async (newSettings: Partial<BrandingSettings>) => {
    const merged: BrandingSettings = {
      ...branding,
      ...newSettings,
    };

    // 1. Instant local state update
    setBranding(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    document.title = `${merged.appName} - University Operating System`;

    // 2. Broadcast event across windows and components
    window.dispatchEvent(new CustomEvent('campus:branding_updated', { detail: merged }));

    // 3. Persist to Supabase system_settings branding_config column
    try {
      const currentSiteSettings = await adminService.getSiteSettings();
      // Purge any legacy __BRANDING__ from faqs to ensure zero data pollution
      const cleanFaqs = (currentSiteSettings.faqs || []).filter((f: any) => f.question !== '__BRANDING__');

      await adminService.updateSiteSettings({
        branding_config: merged,
        faqs: cleanFaqs,
        hero_badge: merged.tagline || currentSiteSettings.hero_badge,
      });
    } catch (err) {
      console.warn('Backend sync for branding failed, persisted locally in storage:', err);
    }
  };

  const resetToDefaults = async () => {
    await updateBranding(DEFAULT_BRANDING);
  };

  // Smart brand name renderer: splits words or camelCase nicely
  const renderBrandName = (className = 'text-xl font-black tracking-tight text-slate-900 dark:text-white', highlightClass = 'text-primary-600 dark:text-primary-400') => {
    const rawName = branding.appName || 'CampusSphere';
    
    // Check if name has spaces
    if (rawName.includes(' ')) {
      const parts = rawName.split(' ');
      const first = parts.slice(0, -1).join(' ');
      const last = parts[parts.length - 1];
      return (
        <span className={className}>
          {first}{' '}
          <span className={highlightClass}>{last}</span>
        </span>
      );
    }

    // Check for CamelCase split (e.g. CampusSphere -> Campus + Sphere)
    const match = rawName.match(/^([A-Z][a-z0-9]+)([A-Z][A-Za-z0-9]*)$/);
    if (match) {
      return (
        <span className={className}>
          {match[1]}
          <span className={highlightClass}>{match[2]}</span>
        </span>
      );
    }

    // Fallback if single lowercase or uppercase word
    return (
      <span className={className}>
        <span className={highlightClass}>{rawName}</span>
      </span>
    );
  };

  return (
    <BrandingContext.Provider value={{ branding, updateBranding, resetToDefaults, renderBrandName }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = (): BrandingContextType => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
