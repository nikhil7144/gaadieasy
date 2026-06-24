"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Images, Maximize2, Minus, Plus, X } from "lucide-react";
import type { VehicleMedia } from "@/types/automobile";

type VehicleGalleryProps = {
  media: VehicleMedia[];
  title: string;
};

export function VehicleGallery({ media, title }: VehicleGalleryProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState(media[0]?.id ?? "");
  const [zoom, setZoom] = useState(1);
  const colors = useMemo(
    () => Array.from(new Set(media.map((item) => item.colorName).filter(Boolean))) as string[],
    [media],
  );
  const visibleMedia = filter === "all" ? media : media.filter((item) => item.colorName === filter);
  const selectedIndex = Math.max(0, visibleMedia.findIndex((item) => item.id === selectedId));
  const selectedMedia = visibleMedia[selectedIndex] ?? visibleMedia[0] ?? media[0];
  const primary = media[0];
  const secondary = media.slice(1, 5);

  function openViewer(id: string, nextFilter?: string) {
    if (nextFilter) setFilter(nextFilter);
    setSelectedId(id);
    setZoom(1);
    setOpen(true);
  }

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
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowRight") movePhoto(1);
      if (event.key === "ArrowLeft") movePhoto(-1);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [movePhoto, open]);

  if (!primary) {
    return null;
  }

  return (
    <>
      <div className={`grid gap-3 ${secondary.length >= 2 ? "lg:grid-cols-[1.4fr_.8fr]" : ""}`}>
        <button
          className="group relative min-h-[320px] overflow-hidden rounded-lg bg-slate-900 text-left"
          onClick={() => openViewer(primary.id)}
          type="button"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={primary.url} alt={primary.alt} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950">
              <Images size={17} /> See all photos
            </span>
          </div>
        </button>
        {secondary.length >= 2 && (
          <div className="grid grid-cols-2 gap-3">
            {secondary.map((item) => (
              <button className="relative overflow-hidden rounded-lg bg-slate-900" onClick={() => openViewer(item.id)} type="button" key={item.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="h-full min-h-[150px] w-full object-cover transition duration-500 hover:scale-105" src={item.url} alt={item.alt} />
              </button>
            ))}
          </div>
        )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 bg-slate-950/95 p-4 text-white backdrop-blur">
          <div className="mx-auto flex h-full max-w-7xl flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-lime-300">Vehicle photos</p>
                <h2 className="text-2xl font-black">{title}</h2>
              </div>
              <button className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20" onClick={() => setOpen(false)} type="button" aria-label="Close gallery">
                <X />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto py-4">
              <button
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${filter === "all" ? "bg-lime-300 text-slate-950" : "bg-white/10"}`}
                onClick={() => {
                  setFilter("all");
                  selectPhoto(media[0]?.id ?? "");
                }}
                type="button"
              >
                All photos
              </button>
              {colors.map((color) => (
                <button
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${filter === color ? "bg-lime-300 text-slate-950" : "bg-white/10"}`}
                  onClick={() => {
                    setFilter(color);
                    selectPhoto(media.find((item) => item.colorName === color)?.id ?? media[0]?.id ?? "");
                  }}
                  type="button"
                  key={color}
                >
                  {color}
                </button>
              ))}
            </div>
            <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_280px]">
              <section className="relative min-h-[420px] overflow-hidden rounded-lg bg-black/30">
                <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-slate-950/70 px-3 py-2 text-xs font-black uppercase text-lime-200">
                  <Maximize2 size={14} />
                  {selectedIndex + 1} / {visibleMedia.length}
                </div>
                <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                  <button
                    className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
                    onClick={() => setZoom((current) => Math.max(1, Number((current - 0.25).toFixed(2))))}
                    type="button"
                    aria-label="Zoom out"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="min-w-14 rounded-full bg-white/10 px-3 py-2 text-center text-xs font-black">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
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
                      className="absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 transition hover:bg-lime-300 hover:text-slate-950"
                      onClick={() => movePhoto(-1)}
                      type="button"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft />
                    </button>
                    <button
                      className="absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 transition hover:bg-lime-300 hover:text-slate-950"
                      onClick={() => movePhoto(1)}
                      type="button"
                      aria-label="Next photo"
                    >
                      <ChevronRight />
                    </button>
                  </>
                ) : null}
                <div className="flex h-full min-h-[420px] items-center justify-center overflow-auto p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="max-h-[calc(100vh-230px)] max-w-full select-none object-contain transition-transform duration-200"
                    src={selectedMedia.url}
                    alt={selectedMedia.alt}
                    style={{ transform: `scale(${zoom})` }}
                  />
                </div>
                <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-slate-950/70 p-3 text-sm text-emerald-50">
                  {selectedMedia.colorName ? `${selectedMedia.colorName} - ` : ""}
                  {selectedMedia.alt}
                </div>
              </section>
              <aside className="min-h-0 overflow-y-auto rounded-lg bg-white/5 p-3">
                <div className="mb-3 text-xs font-black uppercase tracking-wide text-lime-300">Click photo to view</div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                  {visibleMedia.map((item) => (
                    <button
                      className={`overflow-hidden rounded-lg border text-left transition ${
                        selectedMedia.id === item.id ? "border-lime-300 bg-lime-300/10" : "border-white/10 bg-white/5 hover:border-white/30"
                      }`}
                      onClick={() => selectPhoto(item.id)}
                      type="button"
                      key={item.id}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="aspect-[4/3] w-full object-cover" src={item.url} alt={item.alt} />
                      <div className="p-2 text-xs font-bold text-emerald-50">
                        {item.colorName ? `${item.colorName} - ` : ""}
                        {item.alt}
                      </div>
                    </button>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
