export default function CartLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 animate-pulse">
      <div className="h-8 w-24 rounded bg-gray-100 mb-8" />
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-6 border-b border-gray-100">
              <div className="h-24 w-24 shrink-0 rounded-xl bg-gray-100" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-48 rounded bg-gray-100" />
                <div className="h-4 w-24 rounded bg-gray-100" />
                <div className="h-8 w-28 rounded-lg bg-gray-100" />
              </div>
              <div className="h-5 w-16 rounded bg-gray-100" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4 h-fit">
          <div className="h-5 w-28 rounded bg-gray-100" />
          <div className="h-4 w-full rounded bg-gray-100" />
          <div className="h-4 w-3/4 rounded bg-gray-100" />
          <div className="h-px w-full bg-gray-100" />
          <div className="h-5 w-full rounded bg-gray-100" />
          <div className="h-12 w-full rounded-xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
