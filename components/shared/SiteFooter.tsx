import Link from "next/link";
import { BrandLockup } from "@/components/shared/BrandLockup";
import { brands as seedBrands, cities } from "@/lib/data";
import { getFooterComparisons } from "@/lib/services/comparisons";
import type { Brand, ComparisonPage } from "@/types/automobile";

export async function SiteFooter({
  brandsOverride,
  comparisonsOverride,
}: {
  brandsOverride?: Brand[];
  comparisonsOverride?: ComparisonPage[];
} = {}) {
  const brands = brandsOverride?.length ? brandsOverride : seedBrands;
  const comparisons = comparisonsOverride ?? await getFooterComparisons();

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
              <Link className="rounded-full bg-white/10 px-3 py-1 text-xs transition hover:bg-lime-300 hover:text-slate-950" href={`/discover?type=cars&city=${city.slug}`} key={city.id}>
                {city.name}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-lime-300">Brands</h3>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-300">
            {brands.map((brand) => (
              <Link className="hover:text-lime-300" href={`/brands/${brand.slug}`} key={brand.id}>
                {brand.name}
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
