import { describe, it, expect } from "vitest";
import {
  APP_NAME,
  APP_YEAR,
  COPYRIGHT_TEXT,
  NEXT_EVENT_DATE,
  NAV_SCROLL_THRESHOLD,
  COUNTER_DURATION,
  COUNTER_STEP_TIME,
  DEFAULT_PAGE_SIZE,
  STORAGE_BUCKET_NEWS,
  DEFAULT_BRAND_COLOR,
  DEFAULT_TIMEZONE,
  DEFAULT_TEMPLATE,
  SOCIAL_PLATFORMS,
  LANDING_STATS,
  TIMELINE_YEARS,
  EESTEC_WEBSITE,
  EESTEC_ORG_NAME,
  JOB_AD_FILTERS,
  EVENT_STATUS_COLORS,
  REGISTRATION_STATUS_STYLES,
  SOCIAL_ICON_URLS,
  ROUTES,
} from "@/lib/constants";

describe("constants", () => {
  it("has correct app name and year", () => {
    expect(APP_NAME).toBe("JobFAIR");
    expect(APP_YEAR).toBe(2026);
  });

  it("copyright text includes name and year", () => {
    expect(COPYRIGHT_TEXT).toContain(APP_NAME);
    expect(COPYRIGHT_TEXT).toContain(String(APP_YEAR));
  });

  it("NEXT_EVENT_DATE is a non-empty string", () => {
    expect(NEXT_EVENT_DATE.length).toBeGreaterThan(0);
  });

  it("NAV_SCROLL_THRESHOLD is a positive number", () => {
    expect(NAV_SCROLL_THRESHOLD).toBeGreaterThan(0);
  });

  it("counter animation params are valid", () => {
    expect(COUNTER_DURATION).toBeGreaterThan(0);
    expect(COUNTER_STEP_TIME).toBeGreaterThan(0);
    expect(COUNTER_DURATION / COUNTER_STEP_TIME).toBeGreaterThan(1);
  });

  it("DEFAULT_PAGE_SIZE is positive", () => {
    expect(DEFAULT_PAGE_SIZE).toBeGreaterThan(0);
  });

  it("default values are set", () => {
    expect(DEFAULT_BRAND_COLOR).toMatch(/^#/);
    expect(DEFAULT_TIMEZONE).toBeTruthy();
    expect(DEFAULT_TEMPLATE).toBeTruthy();
    expect(STORAGE_BUCKET_NEWS).toBeTruthy();
  });

  it("SOCIAL_PLATFORMS has entries", () => {
    expect(SOCIAL_PLATFORMS.length).toBeGreaterThan(0);
    expect(SOCIAL_PLATFORMS).toContain("LinkedIn");
    expect(SOCIAL_PLATFORMS).toContain("GitHub");
  });

  it("LANDING_STATS has 4 entries with value and label", () => {
    expect(LANDING_STATS).toHaveLength(4);
    LANDING_STATS.forEach((stat) => {
      expect(stat.value).toBeTruthy();
      expect(stat.label).toBeTruthy();
    });
  });

  it("TIMELINE_YEARS is sorted ascending", () => {
    for (let i = 1; i < TIMELINE_YEARS.length; i++) {
      expect(TIMELINE_YEARS[i]).toBeGreaterThanOrEqual(TIMELINE_YEARS[i - 1]);
    }
  });

  it("EESTEC constants are valid", () => {
    expect(EESTEC_WEBSITE).toMatch(/^https?:\/\//);
    expect(EESTEC_ORG_NAME).toBeTruthy();
  });

  it("JOB_AD_FILTERS has all/active/expired", () => {
    expect(JOB_AD_FILTERS.all).toBe("Svi");
    expect(JOB_AD_FILTERS.active).toBe("Aktivni");
    expect(JOB_AD_FILTERS.expired).toBe("Istekli");
  });

  it("EVENT_STATUS_COLORS covers draft/live/past", () => {
    expect(EVENT_STATUS_COLORS.live).toBeTruthy();
    expect(EVENT_STATUS_COLORS.draft).toBeTruthy();
    expect(EVENT_STATUS_COLORS.past).toBeTruthy();
  });

  it("REGISTRATION_STATUS_STYLES covers all statuses", () => {
    expect(REGISTRATION_STATUS_STYLES.registered).toBeTruthy();
    expect(REGISTRATION_STATUS_STYLES.checked_in).toBeTruthy();
    expect(REGISTRATION_STATUS_STYLES.cancelled).toBeTruthy();
  });

  it("SOCIAL_ICON_URLS has URLs for all platforms", () => {
    SOCIAL_PLATFORMS.forEach((p) => {
      expect(SOCIAL_ICON_URLS[p]).toMatch(/^https?:\/\//);
    });
  });

  it("ROUTES has all required paths", () => {
    expect(ROUTES.HOME).toBe("/");
    expect(ROUTES.AUTH).toBe("/auth");
    expect(ROUTES.NOVOSTI).toBe("/novosti");
    expect(ROUTES.OGLASI).toBe("/oglasi");
    expect(ROUTES.DASHBOARD).toBe("/dashboard");
    expect(ROUTES.DASHBOARD_EVENTS).toContain("/dashboard");
  });
});
