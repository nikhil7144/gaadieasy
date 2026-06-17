export function Sk({ className = "" }: { className?: string }) {
  return <div className={`sk ${className}`} aria-hidden="true" />;
}

export function SkDark({ className = "" }: { className?: string }) {
  return <div className={`sk-dark ${className}`} aria-hidden="true" />;
}
