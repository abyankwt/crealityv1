export default function ContactLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 animate-pulse space-y-6">
      <div className="h-8 w-40 rounded bg-gray-100" />
      <div className="h-4 w-72 rounded bg-gray-100" />
      <div className="space-y-4 pt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-11 w-full rounded-xl bg-gray-100" />
        ))}
        <div className="h-32 w-full rounded-xl bg-gray-100" />
        <div className="h-11 w-40 rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}
