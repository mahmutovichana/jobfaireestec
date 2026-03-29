import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NavLink } from "@/components/NavLink";

describe("NavLink", () => {
  it("renders children correctly", () => {
    render(
      <MemoryRouter>
        <NavLink to="/test">Test Link</NavLink>
      </MemoryRouter>
    );
    expect(screen.getByText("Test Link")).toBeInTheDocument();
  });

  it("applies className prop", () => {
    render(
      <MemoryRouter>
        <NavLink to="/test" className="my-class">Link</NavLink>
      </MemoryRouter>
    );
    expect(screen.getByText("Link")).toHaveClass("my-class");
  });

  it("applies activeClassName when route matches", () => {
    render(
      <MemoryRouter initialEntries={["/active"]}>
        <NavLink to="/active" className="base" activeClassName="is-active">
          Active
        </NavLink>
      </MemoryRouter>
    );
    expect(screen.getByText("Active")).toHaveClass("is-active");
  });

  it("does not apply activeClassName when route doesn't match", () => {
    render(
      <MemoryRouter initialEntries={["/other"]}>
        <NavLink to="/active" className="base" activeClassName="is-active">
          Not Active
        </NavLink>
      </MemoryRouter>
    );
    expect(screen.getByText("Not Active")).not.toHaveClass("is-active");
  });
});
