export function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className ?? "h-4 w-full"}`} />;
}

export function ChartSkeleton() {
  return (
    <div
      className="flex h-[300px] items-center justify-center rounded-xl border"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      <div className="skeleton h-full w-full rounded-xl" />
    </div>
  );
}
