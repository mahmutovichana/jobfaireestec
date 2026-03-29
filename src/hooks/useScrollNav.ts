import { useState, useEffect } from "react";
import { NAV_SCROLL_THRESHOLD } from "@/lib/constants";

/**
 * Returns true when the user has scrolled past the threshold.
 */
export function useScrollNav(threshold = NAV_SCROLL_THRESHOLD) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > threshold);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return visible;
}
