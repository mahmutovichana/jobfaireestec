import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PublicNavbar } from "@/components/layout/PublicNavbar";

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

describe("PublicNavbar", () => {
  it("renders default nav items", () => {
    render(<MemoryRouter><PublicNavbar /></MemoryRouter>);
    expect(screen.getByText("Novosti")).toBeInTheDocument();
    expect(screen.getByText("Oglasi")).toBeInTheDocument();
    expect(screen.getByText("Prijava")).toBeInTheDocument();
  });

  it("renders custom nav items", () => {
    render(<MemoryRouter><PublicNavbar items={[{ label: "Custom", to: "/custom" }]} showRegister={false} /></MemoryRouter>);
    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.queryByText("Novosti")).not.toBeInTheDocument();
  });

  it("shows CV button by default", () => {
    render(<MemoryRouter><PublicNavbar /></MemoryRouter>);
    expect(screen.getByText("Ostavi CV")).toBeInTheDocument();
  });

  it("hides CV button when showRegister is false", () => {
    render(<MemoryRouter><PublicNavbar showRegister={false} /></MemoryRouter>);
    expect(screen.queryByText("Ostavi CV")).not.toBeInTheDocument();
  });
});
