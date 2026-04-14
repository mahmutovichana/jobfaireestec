import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Data validation tests (no Supabase calls, pure logic) ──

describe("Event Data Validation", () => {
  function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + "abc123";
  }

  it("generates valid slug from event name", () => {
    const slug = generateSlug("My Cool Event");
    expect(slug).toBe("my-cool-event-abc123");
  });

  it("handles special characters in slug", () => {
    const slug = generateSlug("Event #1: The Best!");
    expect(slug).toBe("event-1-the-best-abc123");
  });

  it("handles empty name", () => {
    const slug = generateSlug("");
    expect(slug).toMatch(/abc123$/);
  });

  it("handles unicode characters", () => {
    const slug = generateSlug("Sajam zapošljavanja");
    expect(slug).toMatch(/^sajam-zapo-ljavanja/);
  });
});

describe("Registration Data Validation", () => {
  function validateRegistrationPayload(data: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!data || Object.keys(data).length === 0) errors.push("Registration data is required");
    if (JSON.stringify(data).length > 4096) errors.push("Registration data too large");
    return { valid: errors.length === 0, errors };
  }

  it("rejects empty data", () => {
    const result = validateRegistrationPayload({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Registration data is required");
  });

  it("accepts valid data", () => {
    const result = validateRegistrationPayload({ name: "Test", email: "test@test.com" });
    expect(result.valid).toBe(true);
  });

  it("rejects oversized data", () => {
    const bigData: Record<string, string> = {};
    for (let i = 0; i < 100; i++) {
      bigData[`field_${i}`] = "x".repeat(100);
    }
    const result = validateRegistrationPayload(bigData);
    expect(result.valid).toBe(false);
  });
});

describe("Duplicate Email Detection", () => {
  function extractEmail(data: Record<string, string>): string {
    return (data["Email Address"] || data["email"] || data["Email"] || "").toLowerCase().trim();
  }

  it("extracts from Email Address field", () => {
    expect(extractEmail({ "Email Address": "Test@Example.com" })).toBe("test@example.com");
  });

  it("extracts from email field", () => {
    expect(extractEmail({ email: " USER@test.com " })).toBe("user@test.com");
  });

  it("returns empty for missing email", () => {
    expect(extractEmail({ name: "Test" })).toBe("");
  });

  it("normalizes case", () => {
    expect(extractEmail({ Email: "UPPER@CASE.COM" })).toBe("upper@case.com");
  });
});

describe("Partner Package Ordering", () => {
  const PACKAGE_ORDER = ["gold", "silver", "standard", "promo"];

  it("gold is first priority", () => {
    expect(PACKAGE_ORDER.indexOf("gold")).toBe(0);
  });

  it("promo is last priority", () => {
    expect(PACKAGE_ORDER.indexOf("promo")).toBe(PACKAGE_ORDER.length - 1);
  });

  it("sorts partners by package order", () => {
    const partners = [
      { name: "C", package: "standard" },
      { name: "A", package: "gold" },
      { name: "B", package: "silver" },
    ];
    const sorted = [...partners].sort(
      (a, b) => PACKAGE_ORDER.indexOf(a.package) - PACKAGE_ORDER.indexOf(b.package)
    );
    expect(sorted[0].name).toBe("A");
    expect(sorted[1].name).toBe("B");
    expect(sorted[2].name).toBe("C");
  });
});

describe("Event Status Transitions", () => {
  const validTransitions: Record<string, string[]> = {
    draft: ["live"],
    live: ["past", "draft"],
    past: ["draft"],
  };

  it("draft can go to live", () => {
    expect(validTransitions["draft"]).toContain("live");
  });

  it("live can go to past", () => {
    expect(validTransitions["live"]).toContain("past");
  });

  it("past can go back to draft", () => {
    expect(validTransitions["past"]).toContain("draft");
  });

  it("draft cannot go directly to past", () => {
    expect(validTransitions["draft"]).not.toContain("past");
  });
});

describe("Audit Log Entity Type Mapping", () => {
  const entityLabels: Record<string, string> = {
    events: "Event",
    team_members: "Tim",
    partners: "Partner",
    news_posts: "Novost",
    job_ads: "Oglas",
    access_requests: "Zahtjev",
  };

  it("maps all tracked tables", () => {
    const trackedTables = ["events", "team_members", "partners", "news_posts", "job_ads", "access_requests"];
    trackedTables.forEach(table => {
      expect(entityLabels).toHaveProperty(table);
    });
  });

  it("all labels are non-empty", () => {
    Object.values(entityLabels).forEach(label => {
      expect(label.length).toBeGreaterThan(0);
    });
  });
});

describe("CV File Validation", () => {
  function validateCVFile(file: { name: string; size: number; type: string }): { valid: boolean; error?: string } {
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) return { valid: false, error: "Invalid file type" };
    if (file.size > maxSize) return { valid: false, error: "File too large" };
    if (file.size === 0) return { valid: false, error: "File is empty" };
    return { valid: true };
  }

  it("accepts PDF files", () => {
    expect(validateCVFile({ name: "cv.pdf", size: 1024, type: "application/pdf" }).valid).toBe(true);
  });

  it("accepts DOCX files", () => {
    expect(validateCVFile({
      name: "cv.docx", size: 1024,
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }).valid).toBe(true);
  });

  it("rejects image files", () => {
    expect(validateCVFile({ name: "photo.jpg", size: 1024, type: "image/jpeg" }).valid).toBe(false);
  });

  it("rejects oversized files", () => {
    expect(validateCVFile({ name: "big.pdf", size: 20 * 1024 * 1024, type: "application/pdf" }).valid).toBe(false);
  });

  it("rejects empty files", () => {
    expect(validateCVFile({ name: "empty.pdf", size: 0, type: "application/pdf" }).valid).toBe(false);
  });
});

describe("Email Validation", () => {
  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("user+tag@domain.co.ba")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("notanemail")).toBe(false);
    expect(isValidEmail("@no-user.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});
