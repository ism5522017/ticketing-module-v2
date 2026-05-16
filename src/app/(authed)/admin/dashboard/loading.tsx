export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="skeleton-deh h-3 w-24" />
        <div className="skeleton-deh h-8 w-56" />
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-deh-xl bg-white p-5 shadow-deh-card ring-1 ring-deh-border"
          >
            <div className="skeleton-deh h-3 w-28" />
            <div className="skeleton-deh mt-3 h-7 w-32" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-deh-xl bg-white p-5 shadow-deh-card ring-1 ring-deh-border"
          >
            <div className="skeleton-deh h-4 w-40" />
            <div className="skeleton-deh mt-4 h-56 w-full" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-deh-xl bg-white p-5 shadow-deh-card ring-1 ring-deh-border"
          >
            <div className="skeleton-deh h-4 w-44" />
            <div className="skeleton-deh mt-4 h-48 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
