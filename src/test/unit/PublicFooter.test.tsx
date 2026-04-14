import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { PublicFooter } from "@/components/layout/PublicFooter";

describe("PublicFooter", () => {
  it("renders footer element", () => {
    render(<BrowserRouter><PublicFooter /></BrowserRouter>);
    const footer = document.querySelector("footer");
    expect(footer).toBeInTheDocument();
  });

  it("contains copyright text", () => {
    render(<BrowserRouter><PublicFooter /></BrowserRouter>);
    expect(screen.getByText(/Sva prava zadržana/i)).toBeInTheDocument();
  });

  it("contains navigation links", () => {
    render(<BrowserRouter><PublicFooter /></BrowserRouter>);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
  });
});
