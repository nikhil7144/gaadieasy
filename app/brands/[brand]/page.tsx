import { notFound } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/public/BrandLogo";
import { VehicleCompareModal } from "@/components/public/VehicleCompareModal";
import { VehicleImage } from "@/components/public/VehicleImage";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";
import { formatShortPrice } from "@/lib/utils/format";

function onRoadPriceHref({
  brandSlug,
  modelSlug,
  variantSlug,
  citySlug = "bangalore",
}: {
  brandSlug?: string;
  modelSlug: string;
  variantSlug?: string;
  citySlug?: string;
}) {
  const params = new URLSearchParams({ model: modelSlug, city: citySlug });

  if (brandSlug) params.set("brand", brandSlug);
  if (variantSlug) params.set("variant", variantSlug);

  return `/on-road-price?${params.toString()}`;
}

export default async function BrandModelsPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: brandSlug } = await params;
  const data = await getVehicleDataSet();
  const brand = data.brands.find((item) => item.slug === brandSlug && item.active);

  if (!brand) {
    notFound();
  }

  const brandModels = data.models
    .filter((model) => model.brandId === brand.id && model.active)
    .map((model) => {
      const modelVariants = data.variants
        .filter((variant) => variant.active && variant.modelId === model.id)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.exShowroomPrice - b.exShowroomPrice);
      const defaultVariant = modelVariants.find((variant) => variant.isDefault) ?? modelVariants[0];
      const category = data.categories.find((item) => item.id === model.categoryId);
      const primaryMedia = data.media
        .filter((item) => item.active && item.modelId === model.id && (!defaultVariant || !item.variantId || item.variantId === defaultVariant.id))
        .sort((a, b) => a.displayOrder - b.displayOrder)[0];

      return {
        ...model,
        imageUrl: primaryMedia?.url || model.imageUrl,
        variants: modelVariants,
        variant: defaultVariant,
        category,
      };
    });

  const allPrices = brandModels.flatMap((model) => model.variants.map((variant) => variant.exShowroomPrice));
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const bodyTypes = Array.from(new Set(brandModels.map((model) => model.bodyType).filter(Boolean)));
  const categoryIds = new Set(brand.categoryIds?.length ? brand.categoryIds : brandModels.map((model) => model.categoryId));
  const similarBrands = data.brands
    .filter(
      (item) =>
        item.active &&
        item.id !== brand.id &&
        (item.categoryIds?.some((categoryId) => categoryIds.has(categoryId)) ||
          data.models.some((model) => model.brandId === item.id && categoryIds.has(model.categoryId))),
    )
    .slice(0, 6);
  const similarModels = data.models
    .filter((model) => model.active && model.brandId !== brand.id && categoryIds.has(model.categoryId))
    .slice(0, 5)
    .map((model) => ({
      ...model,
      brand: data.brands.find((item) => item.id === model.brandId),
      variant: data.variants
        .filter((variant) => variant.active && variant.modelId === model.id)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.exShowroomPrice - b.exShowroomPrice)[0],
    }));
  const compareModels = data.models
    .filter((model) => model.active && categoryIds.has(model.categoryId))
    .map((model) => {
      const modelVariants = data.variants
        .filter((variant) => variant.active && variant.modelId === model.id)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.exShowroomPrice - b.exShowroomPrice);
      const defaultVariant = modelVariants.find((variant) => variant.isDefault) ?? modelVariants[0];
      const primaryMedia = data.media
        .filter((item) => item.active && item.modelId === model.id && (!defaultVariant || !item.variantId || item.variantId === defaultVariant.id))
        .sort((a, b) => a.displayOrder - b.displayOrder)[0];

      return {
        ...model,
        imageUrl: primaryMedia?.url || model.imageUrl,
        brand: data.brands.find((item) => item.id === model.brandId),
        category: data.categories.find((item) => item.id === model.categoryId),
        variants: modelVariants,
      };
    })
    .filter((model) => model.brand && model.variants.length);

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-slate-500">
          <Link className="text-emerald-700 hover:text-emerald-900" href="/">
            Home
          </Link>
          <span>/</span>
          <span>{brand.name}</span>
        </div>

        <section className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start gap-4">
                <BrandLogo className="h-16 w-28 shrink-0" name={brand.name} logoUrl={brand.logoUrl} />
                <div className="min-w-0 flex-1">
                  <h1 className="text-4xl font-black tracking-tight text-slate-950">{brand.name} models</h1>
                  <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">
                    {brand.name} has {brandModels.length} active model{brandModels.length === 1 ? "" : "s"} on Gaadieasy
                    {allPrices.length ? `, with ex-showroom prices from ${formatShortPrice(minPrice)} to ${formatShortPrice(maxPrice)}.` : "."}
                    {" "}Compare variants, city-wise on-road prices, fuel options, specifications and dealer enquiries before visiting a showroom.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {bodyTypes.slice(0, 6).map((type) => (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800" key={type}>
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <section className="mt-8">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-3xl font-black text-slate-950">{brand.name} model list</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Select a model to check exact city on-road price.</p>
                </div>
                <Link className="text-sm font-black text-emerald-700" href="/?type=cars#vehicle-home">
                  Change brand
                </Link>
              </div>

              <div className="mt-5 space-y-4">
                {brandModels.map((model) => {
                  const fuels = Array.from(new Set(model.variants.map((variant) => variant.fuelType))).join("/");
                  const transmissions = Array.from(new Set(model.variants.map((variant) => variant.transmission))).join("/");
                  const engine = model.variant?.engineCapacity;
                  const seats = model.variant?.seatingCapacity;
                  const modelPrices = model.variants.map((variant) => variant.exShowroomPrice);
                  const priceMin = modelPrices.length ? Math.min(...modelPrices) : 0;
                  const priceMax = modelPrices.length ? Math.max(...modelPrices) : 0;

                  return (
                    <div
                      className="grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md md:grid-cols-[320px_1fr]"
                      key={model.id}
                    >
                      <Link className="bg-slate-100 md:min-h-56" href={onRoadPriceHref({ brandSlug: brand.slug, modelSlug: model.slug, variantSlug: model.variant?.slug })}>
                        <VehicleImage className="h-full min-h-56 w-full object-cover" src={model.imageUrl} alt={model.name} />
                      </Link>
                      <div className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-xs font-black uppercase tracking-wide text-emerald-700">{model.category?.name ?? model.bodyType}</div>
                            <Link href={onRoadPriceHref({ brandSlug: brand.slug, modelSlug: model.slug, variantSlug: model.variant?.slug })}>
                              <h3 className="mt-1 text-2xl font-black text-slate-950 hover:text-emerald-700">{brand.name} {model.name}</h3>
                            </Link>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-lime-900">
                              {model.variants.length} variant{model.variants.length === 1 ? "" : "s"}
                            </span>
                            <VehicleCompareModal
                              models={compareModels}
                              brands={data.brands}
                              cities={data.cities}
                              initialModelId={model.id}
                            />
                          </div>
                        </div>
                        <div className="mt-3 text-2xl font-black text-slate-950">
                          {modelPrices.length ? `${formatShortPrice(priceMin)} - ${formatShortPrice(priceMax)}` : "Price pending"}
                          <span className="ml-2 align-middle text-sm font-semibold text-slate-500">ex-showroom</span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-slate-600">
                          {fuels ? <span>{fuels}</span> : null}
                          {fuels && transmissions ? <span>/</span> : null}
                          {transmissions ? <span>{transmissions}</span> : null}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold text-slate-700">
                          {engine ? <span className="rounded-md bg-slate-50 px-3 py-2">{engine}</span> : null}
                          {model.variant?.mileage ? <span className="rounded-md bg-slate-50 px-3 py-2">{model.variant.mileage}</span> : null}
                          {seats ? <span className="rounded-md bg-slate-50 px-3 py-2">{seats} seats</span> : null}
                        </div>
                        <Link className="mt-5 inline-flex rounded-md border border-emerald-500 px-5 py-3 text-sm font-black text-emerald-700" href={onRoadPriceHref({ brandSlug: brand.slug, modelSlug: model.slug, variantSlug: model.variant?.slug })}>
                          View on-road price
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-4">
                <h2 className="text-xl font-black text-slate-950">Similar brands</h2>
              </div>
              <div className="grid grid-cols-3">
                {similarBrands.map((item) => (
                  <Link className="grid min-h-28 place-items-center border-b border-r border-slate-100 p-3 text-center hover:bg-emerald-50" href={`/brands/${item.slug}`} key={item.id}>
                    <BrandLogo className="h-12 w-20" name={item.name} logoUrl={item.logoUrl} />
                    <div className="mt-2 text-xs font-black text-slate-800">{item.name}</div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-4">
                <h2 className="text-xl font-black text-slate-950">Similar models</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {similarModels.map((model) => (
                  <Link
                    className="block p-4 hover:bg-emerald-50"
                    href={onRoadPriceHref({ brandSlug: model.brand?.slug, modelSlug: model.slug, variantSlug: model.variant?.slug })}
                    key={model.id}
                  >
                    <div className="text-xs font-black uppercase text-emerald-700">{model.brand?.name}</div>
                    <div className="mt-1 font-black text-slate-950">{model.name}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-500">
                      {model.variant ? `${model.variant.fuelType} / ${formatShortPrice(model.variant.exShowroomPrice)}` : model.bodyType}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </main>
      <SiteFooter brandsOverride={[brand, ...similarBrands]} />
    </div>
  );
}
