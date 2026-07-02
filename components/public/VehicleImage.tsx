"use client";

import { useState } from "react";

type VehicleImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
};

export function VehicleImage({ src, alt, className }: VehicleImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`grid place-items-center bg-slate-100 text-center ${className ?? ""}`}>
        <div className="px-4">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-lime-300 text-lg font-black text-slate-950">
            {alt.slice(0, 1)}
          </div>
          <div className="mt-2 text-sm font-black text-slate-700">{alt}</div>
          <div className="mt-1 text-xs font-bold text-slate-500">Image pending</div>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}
