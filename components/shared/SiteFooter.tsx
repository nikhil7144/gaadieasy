import Link from "next/link";
import { BrandLockup } from "@/components/shared/BrandLockup";
import { brands as seedBrands, cities } from "@/lib/data";
import { getFooterComparisons } from "@/lib/services/comparisons";
import { getSeoPagesForNavigation } from "@/lib/services/seo";
import type { Brand, ComparisonPage } from "@/types/automobile";

export function SiteFooter({
  brandsOverride,
  comparisonsOverride,
}: {
  brandsOverride?: Brand[];
  comparisonsOverride?: ComparisonPage[];
} = {}) {
  const seoPages = getSeoPagesForNavigation();
  const brands = brandsOverride?.length ? brandsOverride : seedBrands;
  const comparisons = comparisonsOverride ?? getFooterComparisons();

  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
        <div>
          <BrandLockup href="/" size="footer" />
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
            Check real on-road vehicle prices in your city and connect with verified dealers instantly.
          </p>
          <p className="mt-4 text-xs text-slate-400">
            Pricing is indicative and depends on final tax, insurance, accessories and dealer quote.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-lime-300">Popular cities</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {cities.map((city) => (
              <Link className="rounded-full bg-white/10 px-3 py-1 text-xs" href={`/discover?type=cars&city=${city.slug}`} key={city.id}>
                {city.name}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-lime-300">Brands</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            {brands.slice(0, 5).map((brand) => (
              <div key={brand.id}>{brand.name}</div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-lime-300">SEO pages</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            {seoPages.map((page) => (
              <Link className="block hover:text-lime-300" href={`/seo/${page.slug}`} key={page.id}>
                {page.title}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-lime-300">Comparisons</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            {comparisons.map((page) => (
              <Link className="block hover:text-lime-300" href={`/compare/${page.slug}`} key={page.id}>
                {page.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
