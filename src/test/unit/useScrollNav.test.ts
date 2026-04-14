import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScrollNav } from "@/hooks/useScrollNav";

describe("useScrollNav", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollY", { writable: true, value: 0 });
  });

  it("returns false initially (no scroll)", () => {
    const { result } = renderHook(() => useScrollNav());
    expect(result.current).toBe(false);
  });

  it("returns true after scrolling past threshold", () => {
    const { result } = renderHook(() => useScrollNav(50));
    act(() => {
      Object.defineProperty(window, "scrollY", { writable: true, value: 100 });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);
  });

  it("returns false when scrolling back above threshold", () => {
    const { result } = renderHook(() => useScrollNav(50));
    act(() => {
      Object.defineProperty(window, "scrollY", { writable: true, value: 100 });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);
    act(() => {
      Object.defineProperty(window, "scrollY", { writable: true, value: 10 });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(false);
  });

  it("uses custom threshold", () => {
    const { result } = renderHook(() => useScrollNav(200));
    act(() => {
      Object.defineProperty(window, "scrollY", { writable: true, value: 150 });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(false);
    act(() => {
      Object.defineProperty(window, "scrollY", { writable: true, value: 250 });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);
  });

  it("cleans up event listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useScrollNav());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    removeSpy.mockRestore();
  });
});
