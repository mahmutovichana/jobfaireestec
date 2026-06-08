// ── App-wide constants ──
// Centralized hardcoded values for easy maintenance

export const APP_NAME = "JobFAIR";
export const APP_YEAR = 2026;
export const COPYRIGHT_TEXT = `© ${APP_YEAR} ${APP_NAME}. Sva prava zadržana.`;

// Event dates
export const NEXT_EVENT_DATE = "03. i 04. novembar 2026.";
export const NEXT_EVENT_YEAR_SHORT = "'26";

// Hero taglines
export const HERO_TITLE = "Iskoristi svoju";
export const HERO_TITLE_ACCENT = "šansu!";
export const HERO_SUBTITLE = "Sajam zapošljavanja za studente i diplomce tehničko-tehnoloških fakulteta i ekonomije";

// Navigation scroll threshold
export const NAV_SCROLL_THRESHOLD = 80;

// Animation durations (ms)
export const COUNTER_DURATION = 2000;
export const COUNTER_STEP_TIME = 20;

// Pagination
export const DEFAULT_PAGE_SIZE = 15;

// Upload paths
export const STORAGE_BUCKET_NEWS = "news-images";
export const UPLOAD_FOLDER_THUMBNAILS = "thumbnails";
export const UPLOAD_FOLDER_GALLERY = "gallery";
export const UPLOAD_FOLDER_JOB_ADS = "job-ads";

// Default values
export const DEFAULT_BRAND_COLOR = "#7C3AED";
export const DEFAULT_TIMEZONE = "America/New_York";
export const DEFAULT_TEMPLATE = "split";
export const DEFAULT_PRIMARY_COLOR = "#7C3AED";

// Social platforms
export const SOCIAL_PLATFORMS = [
  "Twitter / X",
  "LinkedIn",
  "Instagram",
  "Facebook",
  "YouTube",
  "TikTok",
  "GitHub",
] as const;

// Stats data
export const LANDING_STATS = [
  { value: "5000+", label: "Posjetitelja godišnje" },
  { value: "3000+", label: "Unosa u CV bazu" },
  { value: "100+", label: "Kompanija učesnica" },
  { value: "50+", label: "Medijskih partnera" },
] as const;

// Timeline years
export const TIMELINE_YEARS = [
  2008, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020,
  2021, 2022, 2023, 2024, 2025,
] as const;

// EESTEC info
export const EESTEC_WEBSITE = "https://www.eestec-sa.ba/";
export const EESTEC_ORG_NAME = "EESTEC LC Sarajevo";

// JobFAIR social links
export const JOBFAIR_SOCIALS = {
  instagram: "https://www.instagram.com/jobfair.sarajevo/",
  linkedin: "https://www.linkedin.com/company/jobfair-iskoristi-svoju-sansu",
  facebook: "https://www.facebook.com/JobfairIskoristiSvojuSansu",
} as const;

// Filter options
export const JOB_AD_FILTERS = {
  all: "Svi",
  active: "Aktivni",
  expired: "Istekli",
} as const;

export type JobAdFilterKey = keyof typeof JOB_AD_FILTERS;

// Status colors for events (dashboard)
export const EVENT_STATUS_COLORS: Record<string, string> = {
  live: "bg-success text-success-foreground",
  draft: "bg-muted text-muted-foreground",
  past: "bg-secondary/20 text-secondary",
};

// Registration status styles
export const REGISTRATION_STATUS_STYLES: Record<string, string> = {
  registered: "bg-primary/10 text-primary border-0",
  checked_in: "bg-success/10 text-success border-0",
  cancelled: "bg-destructive/10 text-destructive border-0",
};

// Social icon URLs  
export const SOCIAL_ICON_URLS: Record<string, string> = {
  "Twitter / X": "https://cdn.simpleicons.org/x/ffffff",
  LinkedIn: "https://cdn.simpleicons.org/linkedin/ffffff",
  Instagram: "https://cdn.simpleicons.org/instagram/ffffff",
  Facebook: "https://cdn.simpleicons.org/facebook/ffffff",
  YouTube: "https://cdn.simpleicons.org/youtube/ffffff",
  TikTok: "https://cdn.simpleicons.org/tiktok/ffffff",
  GitHub: "https://cdn.simpleicons.org/github/ffffff",
};

// Route paths
export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  NOVOSTI: "/novosti",
  OGLASI: "/oglasi",
  DASHBOARD: "/dashboard",
  DASHBOARD_EVENTS: "/dashboard/events",
  DASHBOARD_NEWS: "/dashboard/news",
  DASHBOARD_JOB_ADS: "/dashboard/job-ads",
  DASHBOARD_ATTENDEES: "/dashboard/attendees",
  DASHBOARD_ANALYTICS: "/dashboard/analytics",
  DASHBOARD_INTEGRATIONS: "/dashboard/integrations",
  DASHBOARD_SETTINGS: "/dashboard/settings",
  DASHBOARD_PARTNERS: "/dashboard/partners",
  PARTNERI: "/partneri",
} as const;
