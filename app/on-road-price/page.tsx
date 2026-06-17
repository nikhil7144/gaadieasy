import type { Metadata } from "next";
import { CityPriceSelector } from "@/components/public/CityPriceSelector";
import { LeadForm } from "@/components/public/LeadForm";
import { PriceBreakdown } from "@/components/public/PriceBreakdown";
import { PricingExplorer } from "@/components/public/PricingExplorer";
import { VehicleColorGallery } from "@/components/public/VehicleColorGallery";
import { VehicleGallery } from "@/components/public/VehicleGallery";
import { VehicleOverview, VehicleProsCons } from "@/components/public/VehicleOverview";
import { VehicleSpecifications } from "@/components/public/VehicleSpecifications";
import { VariantsPriceTable } from "@/components/public/VariantsPriceTable";
import { EmiPreview } from "@/components/public/EmiPreview";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";
import { getVehicleMediaForApi } from "@/lib/services/media";
import { calculateOnRoadPriceFromData } from "@/lib/services/pricing";
import { formatIndianPrice, formatShortPrice } from "@/lib/utils/format";
import { BadgeIndianRupee, Gauge, MapPin, ShieldCheck, Zap } from "lucide-react";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; model?: string; variant?: string; city?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const data = await getVehicleDataSet();
  const pricing = calculateOnRoadPriceFromData(params, data);

  const { brand, model, variant, city } = pricing;
  const price = formatIndianPrice(pricing.breakdown.totalOnRoadPrice);
  const colors: string[] = Array.isArray(variant.specifications.colors) ? variant.specifications.colors : [];
  const features: string[] = Array.isArray(variant.specifications.features) ? variant.specifications.features.slice(0, 3) : [];

  const title = `${brand.name} ${model.name} ${variant.name} On-Road Price in ${city.name} | Gaadieasy`;

  const descParts: string[] = [
    `${brand.name} ${model.name} ${variant.name} on-road price in ${city.name} is ${price}.`,
  ];
  if (variant.fuelType) descParts.push(`${variant.fuelType} engine`);
  if (variant.engineCapacity) descParts.push(`${variant.engineCapacity}`);
  if (variant.mileage) descParts.push(`${variant.mileage} mileage`);
  if (colors.length) descParts.push(`Available in ${colors.length} colour${colors.length > 1 ? "s" : ""}: ${colors.slice(0, 3).join(", ")}`);
  if (features.length) descParts.push(`Features: ${features.join(", ")}`);
  descParts.push("Includes RTO, tax and insurance breakdown.");

  const description = descParts.join(". ");

  return {
    title,
    description,
    alternates: {
      canonical: `/on-road-price?brand=${brand.slug}&model=${model.slug}&variant=${variant.slug}&city=${city.slug}`,
    },
    openGraph: {
      title,
      description,
      images: model.imageUrl ? [{ url: model.imageUrl, alt: `${brand.name} ${model.name}` }] : [],
    },
  };
}

function sectionValue(section: unknown, keys: string[]) {
  if (!section || typeof section !== "object" || Array.isArray(section)) return undefined;
  const record = section as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

export default async function OnRoadPricePage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; model?: string; variant?: string; city?: string }>;
}) {
  const params = await searchParams;
  const data = await getVehicleDataSet();
  const pricing = calculateOnRoadPriceFromData(params, data);
  const modelVariants = data.variants.filter((variant) => variant.active && variant.modelId === pricing.model.id);
  const media = await getVehicleMediaForApi(pricing.model.id, pricing.variant.id);
  const heroImage = media[0]?.url ?? pricing.model.imageUrl;
  const variantPrices = modelVariants
    .map((variant) =>
      calculateOnRoadPriceFromData({
        brand: pricing.brand.slug,
        model: pricing.model.slug,
        variant: variant.slug,
        city: pricing.city.slug,
      }, data),
    )
    .sort((a, b) => a.breakdown.totalOnRoadPrice - b.breakdown.totalOnRoadPrice);
  const facts = [
    ["Fuel", pricing.variant.fuelType],
    ["Transmission", pricing.variant.transmission],
    ["Engine", pricing.variant.engineCapacity],
    ["Mileage", pricing.variant.mileage],
    ["Seats", `${pricing.variant.seatingCapacity}`],
    ["Power", sectionValue(pricing.variant.specifications.engine, ["maxPower", "power"])],
    ["Battery", sectionValue(pricing.variant.specifications.ev, ["batteryCapacity", "battery"])],
    ["Range", sectionValue(pricing.variant.specifications.ev, ["claimedRange", "realWorldRange", "range"])],
    ["Payload", sectionValue(pricing.variant.specifications.commercial, ["payloadCapacity", "payload"])],
    ["Wheels", sectionValue(pricing.variant.specifications.commercial, ["numberOfWheels", "wheels"])],
    ["Loader", pricing.model.loaderSize ?? sectionValue(pricing.variant.specifications.commercial, ["loaderSize"])],
    ["Brakes", sectionValue(pricing.variant.specifications.bike, ["brakeType", "brakes"])],
    ["RTO", pricing.rto?.code ?? "Mapped city RTO"],
  ].filter((fact): fact is [string, string] => typeof fact[1] === "string" && Boolean(fact[1]));
  const modelFaqs = pricing.model.faq?.length
    ? pricing.model.faq
    : [
        { question: "Is this final showroom price?", answer: "It is an estimate based on configured tax, RTO and insurance rules." },
        { question: "Can offers change?", answer: "Yes. Dealer and brand offers can change by stock, date and city." },
      ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-0">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0">
            {heroImage ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="h-full w-full object-cover opacity-30" src={heroImage} alt={`${pricing.brand.name} ${pricing.model.name}`} />
              </>
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-emerald-950/60" />
          </div>
          <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[.92fr_1.08fr] lg:py-14">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-lime-300 px-3 py-1 text-xs font-black text-slate-950">
                  <MapPin size={14} /> {pricing.city.name}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-emerald-50">
                  <ShieldCheck size={14} /> Verified dealer routing
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-emerald-50">
                  <Zap size={14} /> Live tax breakdown
                </span>
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
                {pricing.brand.name} {pricing.model.name}
              </h1>
              <p className="mt-3 text-xl font-bold text-lime-200">{pricing.variant.name}</p>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-emerald-50">
                Variant-wise on-road price with taxes, RTO, insurance, offer estimate, specifications, colors and dealer enquiry.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-lime-300 p-4 text-slate-950">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-700">
                    <BadgeIndianRupee size={16} /> On-road price
                  </div>
                  <div className="mt-1 text-2xl font-black">{formatIndianPrice(pricing.breakdown.totalOnRoadPrice)}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                  <div className="text-xs font-bold uppercase text-emerald-100">Ex-showroom</div>
                  <div className="mt-1 text-xl font-black">{formatShortPrice(pricing.variant.exShowroomPrice)}</div>
                </div>
                <div className="rounded-lg border border-amber-200/30 bg-amber-300/15 p-4">
                  <div className="text-xs font-bold uppercase text-amber-100">Tax + fees</div>
                  <div className="mt-1 text-xl font-black">
                    {formatShortPrice(pricing.breakdown.totalOnRoadPrice - pricing.variant.exShowroomPrice)}
                  </div>
                </div>
              </div>
              <div className="mt-7 flex flex-wrap gap-2">
                {facts.map(([label, value]) => (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-emerald-50" key={label}>
                    <Gauge size={15} /> {label}: {value}
                  </span>
                ))}
              </div>
            </div>
            <VehicleGallery media={media} title={`${pricing.brand.name} ${pricing.model.name} ${pricing.variant.name}`} />
          </div>
        </section>

        <nav className="sticky top-[65px] z-30 border-b border-emerald-100 bg-white/95 backdrop-blur">
          <div className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 text-sm font-bold text-slate-600 sm:px-6">
            {[
              ["Overview", "#overview"],
              ["Price", "#price"],
              ["Variants", "#variants"],
              ["Specs", "#specs"],
              ["Colors", "#colors"],
              ["Dealer", "#lead"],
              ["FAQs", "#faqs"],
            ].map(([label, href]) => (
              <a className="shrink-0 rounded-full px-4 py-2 hover:bg-emerald-50 hover:text-emerald-800" href={href} key={href}>
                {label}
              </a>
            ))}
          </div>
        </nav>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <PricingExplorer
            brands={data.brands}
            cities={data.cities}
            models={data.models}
            variants={data.variants}
            categoryIds={[pricing.model.categoryId]}
            initialBrandId={pricing.brand.id}
            initialModelId={pricing.model.id}
            initialCitySlug={pricing.city.slug}
          />
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <VehicleOverview overview={pricing.model.overview} pros={pricing.model.pros} cons={pricing.model.cons} />
            <VehicleProsCons pros={pricing.model.pros} cons={pricing.model.cons} />
            <div id="variants" className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Variant price table</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">Compare {pricing.model.name} variants in {pricing.city.name}</h2>
                </div>
                <span className="rounded-full bg-lime-300 px-3 py-1 text-xs font-black text-slate-950">{modelVariants.length} variants</span>
              </div>
              <VariantsPriceTable
                rows={variantPrices.map((item) => ({
                  id: item.variant.id,
                  name: item.variant.name,
                  slug: item.variant.slug,
                  fuelType: item.variant.fuelType,
                  transmission: item.variant.transmission,
                  totalOnRoadPrice: item.breakdown.totalOnRoadPrice,
                }))}
                brandSlug={pricing.brand.slug}
                modelSlug={pricing.model.slug}
                citySlug={pricing.city.slug}
                activeVariantId={pricing.variant.id}
              />
            </div>

            <div id="price">
              <PriceBreakdown pricing={pricing} cities={data.cities} />
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Key specifications</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {facts.map(([label, value]) => (
                  <div className="rounded-lg bg-slate-50 p-3" key={label}>
                    <div className="text-xs font-bold uppercase text-slate-500">{label}</div>
                    <div className="mt-1 font-black text-slate-950">{value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div id="specs">
              <VehicleSpecifications
                specifications={pricing.variant.specifications}
                specificationGroups={pricing.variant.specificationGroups}
              />
            </div>
            <VehicleColorGallery
              colors={pricing.variant.specifications.colors}
              colorHexMap={pricing.variant.specifications.colorHexMap}
              media={media}
              photoPageHref={`/photos?brand=${pricing.brand.slug}&model=${pricing.model.slug}&variant=${pricing.variant.slug}&city=${pricing.city.slug}`}
            />
            <EmiPreview
              onRoadPrice={pricing.breakdown.totalOnRoadPrice}
              brandSlug={pricing.brand.slug}
              modelSlug={pricing.model.slug}
              variantSlug={pricing.variant.slug}
              citySlug={pricing.city.slug}
              vehicleName={`${pricing.brand.name} ${pricing.model.name} ${pricing.variant.name}`}
            />
          </div>
          <aside className="space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
            <div className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Mapped city dealer</p>
                  <h3 className="mt-1 text-lg font-black text-slate-950">Nearby dealer</h3>
                </div>
                {pricing.dealerOffers.length ? (
                  <span className="rounded-full bg-lime-300 px-3 py-1 text-xs font-black text-slate-950">
                    {pricing.dealerOffers.length} offer{pricing.dealerOffers.length > 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>
              <div className="mt-3">
                <CityPriceSelector
                  cities={data.cities}
                  currentCitySlug={pricing.city.slug}
                  brandSlug={pricing.brand.slug}
                  modelSlug={pricing.model.slug}
                  variantSlug={pricing.variant.slug}
                />
              </div>
              {pricing.dealer ? (
                <div className="mt-3 text-sm leading-6 text-slate-600">
                  <strong className="text-slate-950">{pricing.dealer.name}</strong>
                  <br />
                  {pricing.dealer.area}, {pricing.city.name}
                  <br />
                  Verified contact: {pricing.dealer.contactPerson}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-600">Dealer mapping is pending for this brand and city.</p>
              )}
              {pricing.dealerOffers.length ? (
                <div className="mt-4 space-y-3">
                  {pricing.dealerOffers.map((offer) => (
                    <div className="rounded-lg border border-lime-200 bg-lime-50 p-3" key={offer.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-black text-slate-950">{offer.title}</div>
                          {offer.description ? <p className="mt-1 text-xs leading-5 text-slate-600">{offer.description}</p> : null}
                        </div>
                        <div className="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-black text-emerald-800">
                          {formatShortPrice(offer.discountAmount)}
                        </div>
                      </div>
                      <div className="mt-2 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                        Available in this city
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                  No active dealer offer is mapped for this city and model yet.
                </div>
              )}
            </div>
            <div id="faqs" className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="text-lg font-black text-slate-950">FAQs</h3>
              {modelFaqs.map((faq, index) => (
                <details className="mt-3" key={faq.question} open={index === 0}>
                  <summary className="cursor-pointer font-bold text-slate-800">{faq.question}</summary>
                  <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
            <LeadForm pricing={pricing} />
          </aside>
        </section>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100 bg-white p-3 shadow-lg md:hidden">
        <a className="block rounded-md bg-emerald-500 px-4 py-3 text-center text-sm font-black text-slate-950" href="#lead">
          Enquire now - {formatShortPrice(pricing.breakdown.totalOnRoadPrice)}
        </a>
      </div>
      <SiteFooter />
    </div>
  );
}
