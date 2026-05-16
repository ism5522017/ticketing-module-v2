export default function ManagerDashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="skeleton-deh h-3 w-32" />
        <div className="skeleton-deh h-8 w-64" />
        <div className="skeleton-deh h-3 w-40" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-deh-xl bg-white p-5 shadow-deh-card ring-1 ring-deh-border"
          >
            <div className="skeleton-deh h-10 w-10 rounded-deh-md" />
            <div className="skeleton-deh mt-4 h-2.5 w-20" />
            <div className="skeleton-deh mt-2 h-7 w-12" />
          </div>
        ))}
      </div>

      <div className="rounded-deh-xl bg-white p-5 shadow-deh-card ring-1 ring-deh-border">
        <div className="skeleton-deh h-9 w-full max-w-md" />
        <div className="mt-5 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-deh-md border border-deh-border p-4"
            >
              <div className="skeleton-deh h-4 w-3/5" />
              <div className="skeleton-deh mt-2 h-3 w-2/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
