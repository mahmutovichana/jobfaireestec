import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generic page-level skeleton used as the Suspense fallback for lazy routes.
 * Mirrors the typical dashboard layout (header → cards/table) so the transition
 * to the loaded page feels less jarring than a blank screen or spinner.
 */
export function PageSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-3">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default PageSkeleton;
