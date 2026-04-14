import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { NavLink } from "@/components/NavLink";

function renderNavLink(props: { to: string; children: React.ReactNode; active?: boolean }) {
  return render(
    <BrowserRouter>
      <NavLink {...props} />
    </BrowserRouter>
  );
}

describe("NavLink", () => {
  it("renders a link with text", () => {
    renderNavLink({ to: "/test", children: "Test Link" });
    expect(screen.getByText("Test Link")).toBeInTheDocument();
  });

  it("has correct href", () => {
    renderNavLink({ to: "/about", children: "About" });
    expect(screen.getByRole("link")).toHaveAttribute("href", "/about");
  });
});
