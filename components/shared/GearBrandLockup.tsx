import Link from "next/link";

type GearBrandLockupProps = {
  href?: string;
  className?: string;
  size?: "header" | "sidebar";
};

const sizeClasses = {
  header: "h-8 sm:h-9",
  sidebar: "h-7",
} satisfies Record<NonNullable<GearBrandLockupProps["size"]>, string>;

// GaadiGear-branded equivalent of BrandLockup (components/shared/BrandLockup.tsx)
// -- that one is Gaadieasy's own logo and is used platform-wide, so it can't
// just be swapped in place; this is for the seller-facing surfaces
// (sell landing page, auth tabs, dashboard shell) that are GaadiGear brand,
// not Gaadieasy brand.
export function GearBrandLockup({ href = "/gaadigear", className = "", size = "header" }: GearBrandLockupProps) {
  const content = (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="GaadiGear" className={`${sizeClasses[size]} w-auto object-contain ${className}`} src="/gaadigear-logo.png" />
  );

  if (!href) return content;
  return (
    <Link className="inline-flex items-center" href={href}>
      {content}
    </Link>
  );
}
