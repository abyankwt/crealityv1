export default function DownloadsLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 animate-pulse space-y-8">
      <div className="space-y-3">
        <div className="h-8 w-44 rounded bg-gray-100" />
        <div className="h-4 w-72 rounded bg-gray-100" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-gray-100 px-5 py-4">
            <div className="space-y-2">
              <div className="h-4 w-48 rounded bg-gray-100" />
              <div className="h-3 w-32 rounded bg-gray-100" />
            </div>
            <div className="h-9 w-24 rounded-lg bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
