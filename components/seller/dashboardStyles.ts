// Shared "Supabase-flavored" dashboard design tokens for the seller area --
// dark collapsible sidebar + light, dense, tight-radius content area with
// monospace micro-labels. Scoped to app/seller/** only; the rest of the app
// (admin/dealer/buyer, and the GaadiGear marketing/auth pages) keeps its own
// emerald/lime look, which is deliberately rounder and uses shadows.

export const dashboardBg = "bg-[#f8f9fa]";

export const cardClass = "rounded-lg border border-black/[0.08] bg-white";

export const primaryButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#3ecf8e] px-4 text-sm font-bold text-black transition hover:bg-[#2db97c] disabled:cursor-not-allowed disabled:opacity-50";

export const ghostButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-black/[0.08] px-4 text-sm font-bold text-[#6b7280] transition hover:bg-[#f4f5f7] disabled:cursor-not-allowed disabled:opacity-50";

export const dangerGhostButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-black/[0.08] px-4 text-sm font-bold text-[#ef4444] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50";

export const fieldClass =
  "h-9 w-full rounded-md border border-black/[0.08] bg-white px-3 text-sm font-medium text-[#171717] outline-none transition focus:border-[#3ecf8e] focus:ring-2 focus:ring-[#3ecf8e]/20";

export const microLabelClass = "font-mono text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]";

export const statValueClass = "text-2xl font-black text-[#171717]";

export type BadgeTone = "green" | "amber" | "gray" | "red";

const badgeToneClass: Record<BadgeTone, string> = {
  green: "bg-[#3ecf8e]/15 text-[#0f8a5f]",
  amber: "bg-amber-100 text-[#92400e]",
  gray: "bg-black/[0.06] text-[#6b7280]",
  red: "bg-red-100 text-[#ef4444]",
};

export function badgeClass(tone: BadgeTone) {
  return `inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[0.68rem] font-bold uppercase tracking-[0.08em] ${badgeToneClass[tone]}`;
}
