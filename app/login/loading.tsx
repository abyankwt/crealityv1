export default function LoginLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg animate-pulse space-y-5">
        <div className="h-7 w-20 rounded bg-gray-100" />
        <div className="h-4 w-56 rounded bg-gray-100" />
        <div className="space-y-4 pt-2">
          <div className="h-10 w-full rounded-lg bg-gray-100" />
          <div className="h-10 w-full rounded-lg bg-gray-100" />
          <div className="h-10 w-full rounded-lg bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
