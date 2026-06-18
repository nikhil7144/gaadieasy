import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { BrandShowcase } from "@/components/public/BrandShowcase";
import { HomeVehicleDiscovery, HomepageQuickFilterSections } from "@/components/public/HomeVehicleDiscovery";
import { PricingExplorer } from "@/components/public/PricingExplorer";
import { VehicleCompareModal } from "@/components/public/VehicleCompareModal";
import { VehicleImage } from "@/components/public/VehicleImage";
import { getHomepageComparisons } from "@/lib/services/comparisons";
import { getDiscoveryDatasetForType, getDiscoveryTab } from "@/lib/services/discovery";
import { getPublicHomepageDataForApi } from "@/lib/services/public-data";
import { formatShortPrice } from "@/lib/utils/format";
import type { Brand, VehicleModel, VehicleVariant } from "@/types/automobile";

export const metadata: Metadata = {
  title: "On-Road Vehicle Price Calculator",
  description: "Compare cars, bikes, scooters, EVs and commercial vehicles with city-wise on-road pricing and dealer offers.",
  alternates: {
    canonical: "/",
  },
};

type HomeModel = VehicleModel & {
  brand?: Brand;
  variants?: VehicleVariant[];
};

function modelPriceHref(model?: HomeModel, citySlug = "bangalore") {
  if (!model) return "/on-road-price";

  const params = new URLSearchParams({ model: model.slug, city: citySlug });
  const variant = model.variants?.find((item) => item.isDefault) ?? model.variants?.[0];

  if (model.brand?.slug) params.set("brand", model.brand.slug);
  if (variant?.slug) params.set("variant", variant.slug);

  return `/on-road-price?${params.toString()}`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const selectedType = getDiscoveryTab(params.type).key;
  const data = await getPublicHomepageDataForApi();
  const selectedData = getDiscoveryDatasetForType(data, selectedType);
  const homepageComparisons = await getHomepageComparisons();
  const selectedModels = selectedData.models;
  const selectedBrands = selectedData.brands;
  const selectedBrandSlugs = new Set(selectedBrands.map((brand) => brand.slug));
  const comparisons = homepageComparisons.filter((comparison) =>
    comparison.vehicles.every((vehicle) => selectedBrandSlugs.has(vehicle.brand.slug)),
  );
  const activeTypeLabel = selectedData.tab.label;
  const heroModel = selectedModels[0] ?? data.models[0];
  const defaultCitySlug = data.cities[0]?.slug ?? "bangalore";
  const heroPromotion = data.heroPromotions.find(
    (promotion) =>
      promotion.active &&
      promotion.categoryKey === selectedType &&
      (promotion.placement ?? "homepage_hero") === "homepage_hero",
  );
  const heroImageUrl = heroPromotion?.imageUrl?.trim() || heroModel?.imageUrl?.trim() || "";
  const heroStats = [
    {
      value: heroPromotion?.stat1Value ?? `${data.brands.length}+`,
      label: heroPromotion?.stat1Label ?? "Brands",
    },
    {
      value: heroPromotion?.stat2Value ?? `${data.cities.length}`,
      label: heroPromotion?.stat2Label ?? "Cities",
    },
    {
      value: heroPromotion?.stat3Value ?? `${selectedModels.length}+`,
      label: heroPromotion?.stat3Label ?? "Models",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#84cc16_0,transparent_34%),linear-gradient(135deg,#022c22,#0f172a_60%)] opacity-90" />
          <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:py-20">
            <div>
              <p className="inline-flex rounded-full bg-lime-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950">
                {heroPromotion?.eyebrow ?? `${activeTypeLabel} on-road pricing`}
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl">
                {heroPromotion?.headline ?? `Know the real ${activeTypeLabel.toLowerCase()} price before visiting the showroom.`}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-emerald-50">
                {heroPromotion?.supportingCopy ?? `Compare variants, taxes, RTO charges, insurance estimates and dealer offers for ${activeTypeLabel.toLowerCase()} in one clean buyer journey.`}
              </p>
              <div className="mt-8">
                <PricingExplorer
                  brands={selectedBrands}
                  cities={data.cities}
                  models={selectedModels}
                  variants={data.variants}
                />
              </div>
            </div>
            <a
              className="group rounded-lg border border-white/10 bg-white/10 p-4 text-white shadow-2xl backdrop-blur transition hover:-translate-y-1 hover:border-lime-300"
              href={heroPromotion?.targetUrl ?? modelPriceHref(heroModel)}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-800">
                {heroImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    src={heroImageUrl}
                    alt={heroPromotion?.title ?? `${activeTypeLabel} discovery`}
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-slate-900 text-center">
                    <div className="px-4">
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-lime-300 text-xl font-black text-slate-950">
                        {activeTypeLabel.slice(0, 1)}
                      </div>
                      <div className="mt-3 text-sm font-black text-emerald-50">Image pending</div>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                  {heroPromotion?.eyebrow ? (
                    <p className="inline-flex rounded-full bg-lime-300 px-3 py-1 text-xs font-black text-slate-950">
                      {heroPromotion.eyebrow}
                    </p>
                  ) : null}
                  <h2 className="mt-3 text-2xl font-black text-white">
                    {heroPromotion?.title ?? `${activeTypeLabel} featured model`}
                  </h2>
                  {heroPromotion?.subtitle ? (
                    <p className="mt-1 text-sm leading-6 text-emerald-50">{heroPromotion.subtitle}</p>
                  ) : null}
                  {heroPromotion?.ctaLabel ? (
                    <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">
                      {heroPromotion.ctaLabel}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                {heroStats.map((stat) => (
                  <div className="rounded-lg bg-white/10 p-3" key={`${stat.label}-${stat.value}`}>
                    <div className="text-2xl font-black text-lime-300">{stat.value}</div>
                    <div className="text-xs text-emerald-50">{stat.label}</div>
                  </div>
                ))}
              </div>
            </a>
          </div>
        </section>

        <div id="vehicle-home">
          <HomeVehicleDiscovery
            categories={data.categories}
            brands={selectedBrands}
            models={selectedModels}
            cities={data.cities}
            heroPromotions={data.heroPromotions}
            selectedType={selectedType}
          />
        </div>

        <BrandShowcase
          brands={selectedBrands}
          eyebrow="Browse by brand"
          heading={`${activeTypeLabel} brands`}
        />

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-emerald-700">Popular models</p>
              <h2 className="mt-1 text-3xl font-black text-slate-950">Featured {activeTypeLabel.toLowerCase()} price checks</h2>
            </div>
            <a className="hidden text-sm font-bold text-emerald-700 md:block" href={`/discover?type=${selectedType}&city=${defaultCitySlug}`}>View all</a>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {selectedModels.slice(0, 6).map((model) => {
              const firstVariant = model.variants.find((v) => v.isDefault) ?? model.variants[0];
              return (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg" key={model.id}>
                  <Link href={modelPriceHref(model)}>
                    <div className="aspect-[4/3] bg-slate-100">
                      <VehicleImage className="h-full w-full object-cover" src={model.imageUrl} alt={model.name} />
                    </div>
                  </Link>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-emerald-700">{model.brand?.name} {model.launchLabel ? `- ${model.launchLabel}` : ""}</div>
                        <Link href={modelPriceHref(model)}>
                          <h3 className="mt-1 text-lg font-black text-slate-950 hover:text-emerald-700">{model.name}</h3>
                        </Link>
                      </div>
                      <VehicleCompareModal
                        models={selectedModels}
                        brands={selectedBrands}
                        cities={data.cities}
                        initialModelId={model.id}
                        citySlug={defaultCitySlug}
                      />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{model.bodyType} starting from {formatShortPrice(firstVariant?.exShowroomPrice ?? 0)} ex-showroom.</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <HomepageQuickFilterSections models={selectedModels} selectedType={selectedType} />

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-emerald-700">Popular comparisons</p>
              <h2 className="mt-1 text-3xl font-black text-slate-950">Compare vehicles before you enquire</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {comparisons.map((comparison) => {
              const [firstVehicle, secondVehicle] = comparison.vehicles;
              if (!firstVehicle || !secondVehicle) return null;

              return (
              <Link className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" href={`/compare/${comparison.page.slug}`} key={comparison.page.id}>
                <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                    <div className="overflow-hidden rounded-lg bg-slate-100">
                      <VehicleImage className="aspect-[4/3] w-full object-cover" src={firstVehicle.model.imageUrl} alt={firstVehicle.model.name} />
                      <div className="p-3">
                        <div className="text-xs font-bold text-emerald-700">{firstVehicle.brand.name}</div>
                        <div className="font-black text-slate-950">{firstVehicle.model.name}</div>
                      </div>
                    </div>
                    <div className="mx-auto rounded-full bg-lime-300 px-3 py-2 text-sm font-black text-slate-950">VS</div>
                    <div className="overflow-hidden rounded-lg bg-slate-100">
                      <VehicleImage className="aspect-[4/3] w-full object-cover" src={secondVehicle.model.imageUrl} alt={secondVehicle.model.name} />
                      <div className="p-3">
                        <div className="text-xs font-bold text-emerald-700">{secondVehicle.brand.name}</div>
                        <div className="font-black text-slate-950">{secondVehicle.model.name}</div>
                      </div>
                    </div>
                </div>
                <h3 className="mt-4 text-xl font-black text-slate-950">{comparison.page.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{comparison.page.intro}</p>
              </Link>
              );
            })}
          </div>
        </section>

        <section className="bg-white py-12">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3">
            {["Tax transparency", "Verified dealer routing", "City-wise price pages"].map((title, index) => (
              <div className="rounded-lg border border-emerald-100 p-5" key={title}>
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-lime-300 font-black text-slate-950">{index + 1}</div>
                <h3 className="mt-4 text-xl font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {index === 0
                    ? "Every public price includes a readable breakdown for road tax, RTO, insurance and fees."
                    : index === 1
                      ? "Enquiries are matched with active dealers by brand and city so buyers hear back faster."
                      : "Explore city-specific price pages for popular models, EVs, budgets and buying comparisons."}
                </p>
              </div>
            ))}
          </div>
        </section>

      </main>
      <SiteFooter brandsOverride={selectedBrands} comparisonsOverride={comparisons.map((comparison) => comparison.page)} />
    </div>
  );
}
