import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PublicNavbar } from "@/components/layout/PublicNavbar";

describe("PublicNavbar", () => {
  it("renders default nav items", () => {
    render(
      <MemoryRouter>
        <PublicNavbar />
      </MemoryRouter>
    );
    expect(screen.getByText("Novosti")).toBeInTheDocument();
    expect(screen.getByText("Oglasi")).toBeInTheDocument();
    expect(screen.getByText("Prijava")).toBeInTheDocument();
  });

  it("renders custom nav items", () => {
    render(
      <MemoryRouter>
        <PublicNavbar items={[{ label: "Custom", to: "/custom" }]} showRegister={false} />
      </MemoryRouter>
    );
    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.queryByText("Novosti")).not.toBeInTheDocument();
  });

  it("shows register button by default", () => {
    render(
      <MemoryRouter>
        <PublicNavbar />
      </MemoryRouter>
    );
    expect(screen.getByText("Registracija")).toBeInTheDocument();
  });

  it("hides register button when showRegister is false", () => {
    render(
      <MemoryRouter>
        <PublicNavbar showRegister={false} />
      </MemoryRouter>
    );
    expect(screen.queryByText("Registracija")).not.toBeInTheDocument();
  });
});
