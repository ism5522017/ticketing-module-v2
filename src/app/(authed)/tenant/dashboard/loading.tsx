export default function TenantDashboardLoading() {
    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
            {/* Greeting Skeleton */}
            <div className="h-8 w-64 bg-muted animate-pulse rounded-md mb-6" />

            {/* Profile Card Skeleton */}
            <div className="rounded-xl border bg-card shadow p-6 space-y-4">
                <div className="h-6 w-1/3 bg-muted animate-pulse rounded-md" />
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="h-4 w-full bg-muted animate-pulse rounded-md" />
                    <div className="h-4 w-full bg-muted animate-pulse rounded-md" />
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded-md" />
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded-md" />
                </div>
            </div>

            {/* Tickets List Skeleton */}
            <div className="space-y-4 mt-8">
                <div className="h-6 w-32 bg-muted animate-pulse rounded-md mb-4" />
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg border p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="space-y-2 w-full sm:w-1/2">
                            <div className="h-5 w-full bg-muted animate-pulse rounded-md" />
                            <div className="h-4 w-2/3 bg-muted animate-pulse rounded-md" />
                        </div>
                        <div className="h-8 w-24 bg-muted animate-pulse rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}