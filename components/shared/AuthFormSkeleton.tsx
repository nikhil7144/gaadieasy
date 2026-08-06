// Real loading placeholder for auth forms that read useSearchParams() (login
// forms checking ?verified=1, signup wizards resuming via ?pending=<id>) --
// those need a client-side Suspense boundary to avoid breaking static
// prerendering, but `fallback={null}` bails out to a blank page with zero
// visible content until JS hydrates. This gives the user something to look
// at in that gap instead of an apparently-broken white screen.
export function AuthFormSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-slate-200 bg-white p-6 shadow-sm" role="status" aria-label="Loading">
      <div className="h-7 w-2/3 rounded bg-slate-200" />
      <div className="mt-6 h-4 w-1/4 rounded bg-slate-100" />
      <div className="mt-2 h-11 w-full rounded-md bg-slate-100" />
      <div className="mt-4 h-4 w-1/4 rounded bg-slate-100" />
      <div className="mt-2 h-11 w-full rounded-md bg-slate-100" />
      <div className="mt-6 h-11 w-full rounded-lg bg-slate-200" />
    </div>
  );
}
