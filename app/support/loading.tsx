export default function SupportLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 animate-pulse space-y-8">
      <div className="space-y-3">
        <div className="h-8 w-48 rounded bg-gray-100" />
        <div className="h-4 w-80 rounded bg-gray-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 p-6 space-y-3">
            <div className="h-8 w-8 rounded-lg bg-gray-100" />
            <div className="h-5 w-32 rounded bg-gray-100" />
            <div className="h-4 w-full rounded bg-gray-100" />
            <div className="h-4 w-3/4 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
