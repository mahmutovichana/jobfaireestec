import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScrollNav } from "@/hooks/useScrollNav";

describe("useScrollNav", () => {
  let scrollY: number;

  beforeEach(() => {
    scrollY = 0;
    Object.defineProperty(window, "scrollY", {
      get: () => scrollY,
      configurable: true,
    });
  });

  it("returns false initially", () => {
    const { result } = renderHook(() => useScrollNav());
    expect(result.current).toBe(false);
  });

  it("returns true after scrolling past threshold", () => {
    const { result } = renderHook(() => useScrollNav(50));

    act(() => {
      scrollY = 100;
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(true);
  });

  it("returns false when scrolling back above threshold", () => {
    const { result } = renderHook(() => useScrollNav(50));

    act(() => {
      scrollY = 100;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);

    act(() => {
      scrollY = 10;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(false);
  });

  it("uses custom threshold", () => {
    const { result } = renderHook(() => useScrollNav(200));

    act(() => {
      scrollY = 150;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(false);

    act(() => {
      scrollY = 250;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);
  });
});
