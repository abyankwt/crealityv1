export default function AccountLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-5 w-40 rounded bg-gray-100" />
      <div className="h-4 w-64 rounded bg-gray-100" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 w-full rounded-xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
