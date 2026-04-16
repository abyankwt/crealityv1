export default function OrdersLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-32 rounded bg-gray-100" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="h-4 w-16 rounded bg-gray-100" />
          </div>
          <div className="h-4 w-48 rounded bg-gray-100" />
          <div className="h-4 w-20 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}
