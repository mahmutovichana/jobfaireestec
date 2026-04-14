import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BackgroundBeams } from "@/components/landing/BackgroundBeams";

describe("BackgroundBeams", () => {
  it("renders SVG element", () => {
    const { container } = render(<BackgroundBeams />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders beam paths", () => {
    const { container } = render(<BackgroundBeams />);
    const paths = container.querySelectorAll("path");
    expect(paths.length).toBeGreaterThan(0);
  });

  it("applies custom className", () => {
    const { container } = render(<BackgroundBeams className="test-class" />);
    expect(container.firstChild).toHaveClass("test-class");
  });

  it("contains gradient definitions", () => {
    const { container } = render(<BackgroundBeams />);
    const gradients = container.querySelectorAll("linearGradient");
    expect(gradients.length).toBe(3);
  });

  it("has pointer-events-none for non-interactivity", () => {
    const { container } = render(<BackgroundBeams />);
    expect(container.firstChild).toHaveClass("pointer-events-none");
  });
});
