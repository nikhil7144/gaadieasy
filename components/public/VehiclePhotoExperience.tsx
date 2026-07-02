"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import type { VehicleMedia } from "@/types/automobile";

type Props = {
  media: VehicleMedia[];
  title: string;
  backHref: string;
  initialColor?: string;
  initialPhotoId?: string;
};

export function VehiclePhotoExperience({ media, title, backHref, initialColor, initialPhotoId }: Props) {
  const colors = useMemo(
    () => Array.from(new Set(media.map((item) => item.colorName).filter(Boolean))) as string[],
    [media],
  );
  const [filter, setFilter] = useState(initialColor && colors.includes(initialColor) ? initialColor : "all");
  const visibleMedia = filter === "all" ? media : media.filter((item) => item.colorName === filter);
  const [selectedId, setSelectedId] = useState(
    initialPhotoId && media.some((item) => item.id === initialPhotoId) ? initialPhotoId : visibleMedia[0]?.id ?? media[0]?.id ?? "",
  );
  const [zoom, setZoom] = useState(1);
  const selectedIndex = Math.max(0, visibleMedia.findIndex((item) => item.id === selectedId));
  const selectedMedia = visibleMedia[selectedIndex] ?? visibleMedia[0] ?? media[0];

  const selectPhoto = useCallback((id: string) => {
    setSelectedId(id);
    setZoom(1);
  }, []);

  const movePhoto = useCallback((direction: 1 | -1) => {
    if (!visibleMedia.length) return;
    const nextIndex = (selectedIndex + direction + visibleMedia.length) % visibleMedia.length;
    selectPhoto(visibleMedia[nextIndex].id);
  }, [selectPhoto, selectedIndex, visibleMedia]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") movePhoto(1);
      if (event.key === "ArrowLeft") movePhoto(-1);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movePhoto]);

  if (!selectedMedia) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm font-bold text-slate-500">
        No photos have been uploaded for this vehicle yet.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Vehicle image studio</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{media.length} image{media.length === 1 ? "" : "s"} available</p>
        </div>
        <Link href={backHref} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700">
          Back to price
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${
            filter === "all" ? "bg-lime-300 text-slate-950" : "bg-white text-slate-700 ring-1 ring-slate-200"
          }`}
          onClick={() => {
            setFilter("all");
            selectPhoto(media[0]?.id ?? "");
          }}
          type="button"
        >
          All images
        </button>
        {colors.map((color) => (
          <button
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${
              filter === color ? "bg-lime-300 text-slate-950" : "bg-white text-slate-700 ring-1 ring-slate-200"
            }`}
            onClick={() => {
              setFilter(color);
              selectPhoto(media.find((item) => item.colorName === color)?.id ?? "");
            }}
            type="button"
            key={color}
          >
            {color}
          </button>
        ))}
      </div>

      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="relative min-h-[520px] overflow-hidden rounded-lg bg-slate-950 shadow-sm">
          <div className="absolute left-4 top-4 z-10 rounded-full bg-slate-950/70 px-3 py-2 text-xs font-black text-lime-200">
            {selectedIndex + 1} / {visibleMedia.length}
          </div>
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
            <button
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              onClick={() => setZoom((current) => Math.max(1, Number((current - 0.25).toFixed(2))))}
              type="button"
              aria-label="Zoom out"
            >
              <Minus size={18} />
            </button>
            <span className="min-w-14 rounded-full bg-white/10 px-3 py-2 text-center text-xs font-black text-white">
              {Math.round(zoom * 100)}%
            </span>
            <button
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              onClick={() => setZoom((current) => Math.min(3, Number((current + 0.25).toFixed(2))))}
              type="button"
              aria-label="Zoom in"
            >
              <Plus size={18} />
            </button>
          </div>
          {visibleMedia.length > 1 ? (
            <>
              <button
                className="absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-lime-300 hover:text-slate-950"
                onClick={() => movePhoto(-1)}
                type="button"
                aria-label="Previous image"
              >
                <ChevronLeft />
              </button>
              <button
                className="absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-lime-300 hover:text-slate-950"
                onClick={() => movePhoto(1)}
                type="button"
                aria-label="Next image"
              >
                <ChevronRight />
              </button>
            </>
          ) : null}
          <div className="flex h-full min-h-[520px] items-center justify-center overflow-auto p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="max-h-[calc(100vh-220px)] max-w-full select-none object-contain transition-transform duration-200"
              src={selectedMedia.url}
              alt={selectedMedia.alt}
              style={{ transform: `scale(${zoom})` }}
            />
          </div>
          <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-slate-950/70 p-3 text-sm font-bold text-emerald-50">
            {selectedMedia.colorName ? `${selectedMedia.colorName} - ` : ""}
            {selectedMedia.alt}
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-3 px-1 text-xs font-black uppercase tracking-wide text-emerald-700">Select image</div>
          <div className="grid max-h-[620px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-1">
            {visibleMedia.map((item) => (
              <button
                className={`overflow-hidden rounded-lg border text-left transition ${
                  selectedMedia.id === item.id ? "border-lime-400 bg-lime-50" : "border-slate-200 bg-slate-50 hover:border-emerald-200"
                }`}
                onClick={() => selectPhoto(item.id)}
                type="button"
                key={item.id}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="aspect-[4/3] w-full object-cover" src={item.url} alt={item.alt} loading="lazy" />
                <div className="p-2 text-xs font-bold text-slate-700">
                  {item.colorName ? `${item.colorName} - ` : ""}
                  {item.alt}
                </div>
              </button>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
