/**
 * Skeleton loaders for improved loading UX
 */

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-slate-200 dark:bg-slate-700";

  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style: React.CSSProperties = {
    width: width ?? "100%",
    height: height ?? (variant === "text" ? "1em" : "100%"),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * Card skeleton for repo cards
 */
export function RepoCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
          <Skeleton width="60%" height={20} className="mb-2" />
          <Skeleton width="80%" height={14} className="mb-3" />
          <div className="flex gap-2">
            <Skeleton width={60} height={20} variant="text" />
            <Skeleton width={60} height={20} variant="text" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * List skeleton for multiple items
 */
export function RepoListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-live="polite" aria-label="Loading repositories">
      {Array.from({ length: count }, (_, index) => `repo-skeleton-${index}`).map((key) => (
        <RepoCardSkeleton key={key} />
      ))}
    </div>
  );
}

/**
 * Detail page skeleton
 */
export function DetailPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={64} height={64} />
        <div className="flex-1">
          <Skeleton width="40%" height={28} className="mb-2" />
          <Skeleton width="60%" height={16} />
        </div>
      </div>

      {/* Analysis skeleton */}
      <div className="grid md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
          >
            <Skeleton width="50%" height={14} className="mb-2" />
            <Skeleton width="70%" height={20} />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <Skeleton width="30%" height={24} className="mb-4" />
        <Skeleton width="100%" height={16} className="mb-2" />
        <Skeleton width="90%" height={16} className="mb-2" />
        <Skeleton width="95%" height={16} className="mb-2" />
        <Skeleton width="60%" height={16} />
      </div>
    </div>
  );
}

/**
 * Landing page hero skeleton
 */
export function HeroSkeleton() {
  return (
    <div className="text-center py-16">
      <Skeleton width="50%" height={48} className="mx-auto mb-4" />
      <Skeleton width="70%" height={20} className="mx-auto mb-2" />
      <Skeleton width="40%" height={20} className="mx-auto mb-8" />
      <div className="flex gap-4 justify-center">
        <Skeleton width={160} height={44} />
        <Skeleton width={160} height={44} />
      </div>
    </div>
  );
}

/**
 * Feature card skeleton
 */
export function FeatureCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
      <Skeleton variant="circular" width={48} height={48} className="mb-3" />
      <Skeleton width="60%" height={20} className="mb-2" />
      <Skeleton width="100%" height={14} className="mb-1" />
      <Skeleton width="90%" height={14} />
    </div>
  );
}

/**
 * Spinner component with accessibility
 */
export function Spinner({
  size = "md",
  className = "",
  label = "Loading",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div
      className={`inline-block ${sizeClasses[size]} ${className}`}
      aria-live="polite"
      aria-label={label}
    >
      <svg
        className="animate-spin text-blue-600 dark:text-blue-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * Full page loading state
 */
export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-slate-600 dark:text-slate-400">{message}</p>
    </div>
  );
}
