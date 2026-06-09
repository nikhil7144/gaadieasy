"use client";

import { useState } from "react";

export function BrandLogo({
  name,
  logoUrl,
  className = "h-14 w-24",
}: {
  name: string;
  logoUrl?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!logoUrl || failed) {
    return (
      <div className={`grid place-items-center rounded-lg bg-lime-300 text-xl font-black text-slate-950 ${className}`}>
        {name.slice(0, 1)}
      </div>
    );
  }

  return (
    <div className={`grid place-items-center rounded-lg bg-white p-2 ring-1 ring-slate-100 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="h-full max-h-10 w-full max-w-20 object-contain" src={logoUrl} alt={`${name} logo`} onError={() => setFailed(true)} />
    </div>
  );
}
