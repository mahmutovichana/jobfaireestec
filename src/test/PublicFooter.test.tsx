import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { COPYRIGHT_TEXT, EESTEC_ORG_NAME } from "@/lib/constants";

describe("PublicFooter", () => {
  it("renders copyright text", () => {
    render(
      <MemoryRouter>
        <PublicFooter />
      </MemoryRouter>
    );
    expect(screen.getByText(COPYRIGHT_TEXT)).toBeInTheDocument();
  });

  it("shows EESTEC link when showEestec is true", () => {
    render(
      <MemoryRouter>
        <PublicFooter showEestec />
      </MemoryRouter>
    );
    expect(screen.getByText(EESTEC_ORG_NAME)).toBeInTheDocument();
  });

  it("hides EESTEC link by default", () => {
    render(
      <MemoryRouter>
        <PublicFooter />
      </MemoryRouter>
    );
    expect(screen.queryByText(EESTEC_ORG_NAME)).not.toBeInTheDocument();
  });
});
