import type { ReactNode } from "react";

export function FormField({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-bold text-slate-500">{label}</span>
      {children}
    </label>
  );
}
