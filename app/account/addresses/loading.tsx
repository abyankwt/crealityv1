export default function AddressesLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-36 rounded bg-gray-100" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 p-5 space-y-3">
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="h-4 w-40 rounded bg-gray-100" />
            <div className="h-4 w-32 rounded bg-gray-100" />
            <div className="h-4 w-20 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
