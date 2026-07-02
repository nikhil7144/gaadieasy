"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Images } from "lucide-react";
import type { VehicleMedia } from "@/types/automobile";

type VehicleColorGalleryProps = {
  colors: string[];
  media: VehicleMedia[];
  photoPageHref?: string;
};

function withPhotoParams(href: string, item?: VehicleMedia, color?: string) {
  const params = new URLSearchParams();
  if (color) params.set("color", color);
  if (item?.id) params.set("photo", item.id);
  const separator = href.includes("?") ? "&" : "?";
  const query = params.toString();
  return query ? `${href}${separator}${query}` : href;
}

export function VehicleColorGallery({ colors, media, photoPageHref }: VehicleColorGalleryProps) {
  const colorOptions = useMemo(
    () => {
      const mediaColors = media.map((item) => item.colorName).filter(Boolean) as string[];
      return Array.from(new Set([...colors, ...mediaColors]));
    },
    [colors, media],
  );
  const [selectedColor, setSelectedColor] = useState<string | undefined>(colorOptions[0]);
  const activeColor = selectedColor && colorOptions.includes(selectedColor) ? selectedColor : colorOptions[0];
  const colorMedia = activeColor ? media.filter((item) => item.colorName === activeColor) : [];
  const visibleMedia = colorMedia.length ? colorMedia : media.slice(0, 3);

  if (!colorOptions.length && !visibleMedia.length) {
    return null;
  }

  return (
    <section id="colors" className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Color gallery</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Colors and images</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-3 py-1 text-xs font-black text-slate-950">
            <Images size={14} /> {visibleMedia.length} photos
          </span>
          {photoPageHref ? (
            <Link
              href={withPhotoParams(photoPageHref, visibleMedia[0], activeColor)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white hover:bg-emerald-700"
            >
              See all images
            </Link>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {colorOptions.map((color) => (
          <button
            className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-2 text-left text-sm font-bold ${
              activeColor === color ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-700"
            }`}
            onClick={() => setSelectedColor(color)}
            type="button"
            key={color}
          >
            <span className="break-words">{color}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {visibleMedia.map((item) => (
          <figure className="overflow-hidden rounded-lg bg-slate-50" key={item.id}>
            {photoPageHref ? (
              <Link href={withPhotoParams(photoPageHref, item, item.colorName ?? activeColor)} className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="aspect-[4/3] w-full object-cover transition duration-300 hover:scale-105" src={item.url} alt={item.alt} loading="lazy" />
              </Link>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="aspect-[4/3] w-full object-cover" src={item.url} alt={item.alt} loading="lazy" />
              </>
            )}
            <figcaption className="p-3 text-sm font-bold text-slate-700">{item.alt}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
