import Link from "next/link";

type BrandLockupProps = {
  href?: string;
  className?: string;
  size?: "header" | "sidebar" | "hero" | "footer";
  showTagline?: boolean;
};

const sizeClasses = {
  header: "h-10 sm:h-11",
  sidebar: "h-9",
  hero: "h-14 sm:h-16",
  footer: "h-11 sm:h-12",
} satisfies Record<NonNullable<BrandLockupProps["size"]>, string>;

export function BrandLockup({
  href = "/",
  className = "",
  size = "header",
  showTagline = false,
}: BrandLockupProps) {
  const content = (
    <span className={`inline-flex flex-col ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={`${sizeClasses[size]} w-auto object-contain`} src="/gaadieasy-logo.png" alt="GaadiEasy" />
      {showTagline ? <span className="mt-1 text-xs font-medium text-slate-500">On-road pricing platform</span> : null}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-flex items-center">
      {content}
    </Link>
  );
}
