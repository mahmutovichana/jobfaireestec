import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo } from "@/components/Logo";

describe("Logo", () => {
  it("renders with default md size", () => {
    render(<Logo />);
    expect(screen.getByText("X")).toBeInTheDocument();
    expect(screen.getByText("job")).toBeInTheDocument();
    expect(screen.getByText("FAIR")).toBeInTheDocument();
  });

  it("renders all size variants without crashing", () => {
    const sizes = ["sm", "md", "lg"] as const;
    sizes.forEach((size) => {
      const { unmount } = render(<Logo size={size} />);
      expect(screen.getByText("FAIR")).toBeInTheDocument();
      unmount();
    });
  });

  it("accepts custom className", () => {
    const { container } = render(<Logo className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
