import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo } from "@/components/Logo";

describe("Logo component", () => {
  it("renders with default size", () => {
    render(<Logo />);
    const el = screen.getByText(/job/i);
    expect(el).toBeInTheDocument();
  });

  it("renders with sm size", () => {
    render(<Logo size="sm" />);
    expect(screen.getByText(/job/i)).toBeInTheDocument();
  });

  it("renders with lg size", () => {
    render(<Logo size="lg" />);
    expect(screen.getByText(/job/i)).toBeInTheDocument();
  });

  it("contains both Job and FAIR text", () => {
    render(<Logo />);
    const container = screen.getByText(/job/i).closest("div") || screen.getByText(/job/i).parentElement;
    expect(container?.textContent).toMatch(/FAIR/i);
  });
});
