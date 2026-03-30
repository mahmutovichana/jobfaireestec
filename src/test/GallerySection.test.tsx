import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { GallerySection } from "@/components/landing/GallerySection";

vi.mock("@/hooks/useGallery", () => ({
  useGalleryImages: () => ({ data: [], isLoading: false }),
}));

describe("GallerySection", () => {
  it("renders gallery heading", () => {
    render(
      <MemoryRouter>
        <GallerySection />
      </MemoryRouter>
    );
    expect(screen.getByText("Galerija")).toBeInTheDocument();
  });

  it("renders fallback images when no db images", () => {
    const { container } = render(
      <MemoryRouter>
        <GallerySection />
      </MemoryRouter>
    );
    const images = container.querySelectorAll("img");
    expect(images.length).toBeGreaterThanOrEqual(4);
  });
});
