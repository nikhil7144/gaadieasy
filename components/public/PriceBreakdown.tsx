import { CityPriceSelector } from "@/components/public/CityPriceSelector";
import { formatIndianPrice } from "@/lib/utils/format";
import type { City, PricingResult } from "@/types/automobile";

type BreakdownRow = [string, number, { hideWhenZero?: boolean }?];

function hasSpecSection(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;
}

function isTwoWheeler(pricing: PricingResult) {
  const bodyType = pricing.model.bodyType.toLowerCase();
  return (
    hasSpecSection(pricing.variant.specifications.bike) ||
    bodyType.includes("bike") ||
    bodyType.includes("scooter") ||
    bodyType.includes("cruiser") ||
    bodyType.includes("commuter") ||
    bodyType.includes("naked") ||
    bodyType.includes("sports")
  );
}

function isCommercial(pricing: PricingResult) {
  const bodyType = pricing.model.bodyType.toLowerCase();
  return (
    hasSpecSection(pricing.variant.specifications.commercial) ||
    Boolean(pricing.model.loaderSize) ||
    bodyType.includes("truck") ||
    bodyType.includes("commercial") ||
    bodyType.includes("pickup") ||
    bodyType.includes("loader")
  );
}

function breakdownRows(pricing: PricingResult): BreakdownRow[] {
  const commonStart: BreakdownRow[] = [
    ["Ex-showroom price", pricing.breakdown.exShowroomPrice],
    ["Road tax", pricing.breakdown.roadTax],
    ["RTO registration", pricing.breakdown.registrationFee],
    ["Insurance estimate", pricing.breakdown.insurance],
  ];

  if (isTwoWheeler(pricing)) {
    return [
      ...commonStart,
      ["RC smart card", pricing.breakdown.smartCardFee, { hideWhenZero: true }],
      ["HSRP number plate", pricing.breakdown.numberPlateFee, { hideWhenZero: true }],
      ["Loan hypothecation", pricing.breakdown.hypothecationFee, { hideWhenZero: true }],
      ["Dealer handling", pricing.breakdown.handlingCharges, { hideWhenZero: true }],
      ["Offer discount", -pricing.breakdown.offerDiscount, { hideWhenZero: true }],
    ];
  }

  if (isCommercial(pricing)) {
    return [
      ...commonStart,
      ["RC smart card", pricing.breakdown.smartCardFee, { hideWhenZero: true }],
      ["HSRP number plate", pricing.breakdown.numberPlateFee, { hideWhenZero: true }],
      ["Loan hypothecation", pricing.breakdown.hypothecationFee, { hideWhenZero: true }],
      ["Fastag", pricing.breakdown.fastagFee, { hideWhenZero: true }],
      ["Dealer/logistics handling", pricing.breakdown.handlingCharges, { hideWhenZero: true }],
      ["Offer discount", -pricing.breakdown.offerDiscount, { hideWhenZero: true }],
    ];
  }

  return [
    ...commonStart,
    ["Smart card", pricing.breakdown.smartCardFee, { hideWhenZero: true }],
    ["Number plate", pricing.breakdown.numberPlateFee, { hideWhenZero: true }],
    ["Hypothecation", pricing.breakdown.hypothecationFee, { hideWhenZero: true }],
    ["Fastag", pricing.breakdown.fastagFee, { hideWhenZero: true }],
    ["Handling/logistics", pricing.breakdown.handlingCharges, { hideWhenZero: true }],
    ["Offer discount", -pricing.breakdown.offerDiscount, { hideWhenZero: true }],
  ];
}

export function PriceBreakdown({ pricing, cities = [] }: { pricing: PricingResult; cities?: City[] }) {
  const rows = breakdownRows(pricing).filter(([, value, options]) => !options?.hideWhenZero || value !== 0);
  const eyebrow = isTwoWheeler(pricing)
    ? "Bike on-road breakdown"
    : isCommercial(pricing)
      ? "Commercial breakdown"
      : "Transparent breakdown";

  return (
    <div className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">On-road price in {pricing.city.name}</h2>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          {cities.length ? (
            <CityPriceSelector
              cities={cities}
              currentCitySlug={pricing.city.slug}
              brandSlug={pricing.brand.slug}
              modelSlug={pricing.model.slug}
              variantSlug={pricing.variant.slug}
            />
          ) : null}
          <div className="rounded-lg bg-lime-300 px-4 py-3 text-right">
            <div className="text-xs font-bold text-slate-700">Total</div>
            <div className="text-lg font-black text-slate-950">{formatIndianPrice(pricing.breakdown.totalOnRoadPrice)}</div>
          </div>
        </div>
      </div>
      <div className="mt-4 divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div className="flex items-center justify-between py-2 text-sm" key={label}>
            <span className="text-slate-600">{label}</span>
            <span className={Number(value) < 0 ? "font-bold text-emerald-700" : "font-bold text-slate-950"}>
              {formatIndianPrice(Number(value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
