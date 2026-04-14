import { describe, it, expect } from "vitest";
import {
  APP_NAME, APP_YEAR, COPYRIGHT_TEXT, HERO_TITLE, HERO_TITLE_ACCENT,
  HERO_SUBTITLE, NAV_SCROLL_THRESHOLD, COUNTER_DURATION, COUNTER_STEP_TIME,
  DEFAULT_PAGE_SIZE, STORAGE_BUCKET_NEWS, DEFAULT_BRAND_COLOR,
  DEFAULT_TIMEZONE, SOCIAL_PLATFORMS, LANDING_STATS, TIMELINE_YEARS,
  EESTEC_WEBSITE, EESTEC_ORG_NAME, JOB_AD_FILTERS, EVENT_STATUS_COLORS,
  REGISTRATION_STATUS_STYLES, ROUTES,
} from "@/lib/constants";

describe("Constants", () => {
  it("APP_NAME is JobFAIR", () => {
    expect(APP_NAME).toBe("JobFAIR");
  });

  it("APP_YEAR is a valid year", () => {
    expect(APP_YEAR).toBeGreaterThan(2020);
    expect(APP_YEAR).toBeLessThan(2100);
  });

  it("COPYRIGHT_TEXT contains APP_NAME and year", () => {
    expect(COPYRIGHT_TEXT).toContain(APP_NAME);
    expect(COPYRIGHT_TEXT).toContain(String(APP_YEAR));
  });

  it("Hero text values are non-empty strings", () => {
    expect(HERO_TITLE.length).toBeGreaterThan(0);
    expect(HERO_TITLE_ACCENT.length).toBeGreaterThan(0);
    expect(HERO_SUBTITLE.length).toBeGreaterThan(0);
  });

  it("NAV_SCROLL_THRESHOLD is a positive number", () => {
    expect(NAV_SCROLL_THRESHOLD).toBeGreaterThan(0);
  });

  it("COUNTER values are sensible", () => {
    expect(COUNTER_DURATION).toBeGreaterThan(COUNTER_STEP_TIME);
  });

  it("DEFAULT_PAGE_SIZE is reasonable", () => {
    expect(DEFAULT_PAGE_SIZE).toBeGreaterThan(0);
    expect(DEFAULT_PAGE_SIZE).toBeLessThanOrEqual(100);
  });

  it("SOCIAL_PLATFORMS has expected platforms", () => {
    expect(SOCIAL_PLATFORMS).toContain("LinkedIn");
    expect(SOCIAL_PLATFORMS).toContain("Instagram");
  });

  it("LANDING_STATS has 4 entries with value and label", () => {
    expect(LANDING_STATS).toHaveLength(4);
    LANDING_STATS.forEach(stat => {
      expect(stat.value).toBeTruthy();
      expect(stat.label).toBeTruthy();
    });
  });

  it("TIMELINE_YEARS is sorted ascending", () => {
    const sorted = [...TIMELINE_YEARS].sort((a, b) => a - b);
    expect([...TIMELINE_YEARS]).toEqual(sorted);
  });

  it("ROUTES contains essential paths", () => {
    expect(ROUTES.HOME).toBe("/");
    expect(ROUTES.AUTH).toBe("/auth");
    expect(ROUTES.DASHBOARD).toContain("/dashboard");
  });

  it("EVENT_STATUS_COLORS has all statuses", () => {
    expect(EVENT_STATUS_COLORS).toHaveProperty("live");
    expect(EVENT_STATUS_COLORS).toHaveProperty("draft");
    expect(EVENT_STATUS_COLORS).toHaveProperty("past");
  });

  it("REGISTRATION_STATUS_STYLES has all statuses", () => {
    expect(REGISTRATION_STATUS_STYLES).toHaveProperty("registered");
    expect(REGISTRATION_STATUS_STYLES).toHaveProperty("checked_in");
    expect(REGISTRATION_STATUS_STYLES).toHaveProperty("cancelled");
  });

  it("JOB_AD_FILTERS has expected keys", () => {
    expect(JOB_AD_FILTERS).toHaveProperty("all");
    expect(JOB_AD_FILTERS).toHaveProperty("active");
    expect(JOB_AD_FILTERS).toHaveProperty("expired");
  });

  it("EESTEC info is correct", () => {
    expect(EESTEC_ORG_NAME).toContain("EESTEC");
    expect(EESTEC_WEBSITE).toMatch(/^https?:\/\//);
  });

  it("DEFAULT_BRAND_COLOR is a valid hex color", () => {
    expect(DEFAULT_BRAND_COLOR).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("STORAGE_BUCKET_NEWS is defined", () => {
    expect(STORAGE_BUCKET_NEWS).toBe("news-images");
  });
});
