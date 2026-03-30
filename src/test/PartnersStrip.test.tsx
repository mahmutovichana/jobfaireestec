import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PartnersStrip } from "@/components/landing/PartnersStrip";

vi.mock("@/hooks/usePartners", () => ({
  usePartners: () => ({ data: [
    { id: "1", name: "Test Partner", logo_url: "https://example.com/logo.png", visible: true, website: "https://example.com" },
  ], isLoading: false }),
}));

describe("PartnersStrip", () => {
  it("renders partner section", () => {
    render(
      <MemoryRouter>
        <PartnersStrip />
      </MemoryRouter>
    );
    expect(screen.getByText(/Partneri/i)).toBeInTheDocument();
  });
});
