import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  shimmer?: boolean;
};

export function Skeleton({ className = "", shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      {...props}
      className={[
        "relative overflow-hidden rounded-md bg-slate-800/50 animate-pulse",
        shimmer ? "qx-skeleton-shimmer" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
