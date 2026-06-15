import { useEffect, useRef, useState } from "react";

/**
 * Defers mounting of its children until the placeholder is near the viewport.
 * This keeps below-the-fold React subtrees (and any Supabase queries inside
 * their hooks) off the critical path, which improves LCP/TBT on the landing.
 */
export function DeferredSection({
  children,
  minHeight = 400,
  rootMargin = "800px",
}: {
  children: React.ReactNode;
  minHeight?: number;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show, rootMargin]);

  return (
    <div ref={ref} style={!show ? { minHeight } : undefined}>
      {show ? children : null}
    </div>
  );
}

/**
 * Lightweight wrapper that fetches team members lazily so the Supabase query
 * only fires when the section is about to enter the viewport.
 */
import { useTeamMembers } from "@/hooks/useTeam";
import { TeamSection } from "./TeamSection";

function TeamSectionWithData() {
  const { data: teamMembers = [] } = useTeamMembers(true);
  return <TeamSection teamMembers={teamMembers} />;
}

export function DeferredTeamSection() {
  return (
    <DeferredSection minHeight={600}>
      <TeamSectionWithData />
    </DeferredSection>
  );
}