export default function PrintingServiceLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 animate-pulse space-y-8">
      <div className="space-y-3">
        <div className="h-8 w-56 rounded bg-gray-100" />
        <div className="h-4 w-96 rounded bg-gray-100" />
      </div>
      <div className="rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="h-5 w-36 rounded bg-gray-100" />
        <div className="h-40 w-full rounded-xl bg-gray-100" />
        <div className="h-11 w-48 rounded-xl bg-gray-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 p-5 space-y-3">
            <div className="h-5 w-28 rounded bg-gray-100" />
            <div className="h-8 w-20 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
