import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/public/BrandLogo";
import { getActiveCityPageSlugs, getCityPageView, type CityModelCard } from "@/lib/services/city-pages";
import { formatShortPrice } from "@/lib/utils/format";

type CityPageRouteProps = {
  params: Promise<{ slug: string }>;
};

function modelHref(card: CityModelCard, citySlug: string) {
  return `/on-road-price?brand=${card.brand.slug}&model=${card.model.slug}&variant=${card.pricing.variant.slug}&city=${citySlug}`;
}

function ModelCard({ card, citySlug }: { card: CityModelCard; citySlug: string }) {
  return (
    <Link
      className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-lime-300 hover:shadow-md"
      href={modelHref(card, citySlug)}
    >
      <div className="relative aspect-[4/3] bg-slate-100">
        {card.model.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="h-full w-full object-cover transition group-hover:scale-[1.02]" src={card.model.imageUrl} alt={card.model.name} />
        ) : (
          <div className="grid h-full place-items-center text-sm font-black text-slate-400">Image pending</div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-emerald-800">
          {card.category.name}
        </span>
      </div>
      <div className="p-4">
        <p className="text-sm font-black text-emerald-700">{card.brand.name}</p>
        <h3 className="mt-1 text-xl font-black text-slate-950">{card.model.name}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {card.model.bodyType} from {formatShortPrice(card.pricing.variant.exShowroomPrice)} ex-showroom
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black text-slate-700">
          <span className="rounded-md bg-emerald-50 px-3 py-2">{card.pricing.variant.fuelType}</span>
          <span className="rounded-md bg-slate-50 px-3 py-2">{card.pricing.variant.transmission}</span>
          <span className="rounded-md bg-slate-50 px-3 py-2">{card.pricing.variant.engineCapacity}</span>
          <span className="rounded-md bg-lime-100 px-3 py-2">{formatShortPrice(card.pricing.breakdown.totalOnRoadPrice)}</span>
        </div>
      </div>
    </Link>
  );
}

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getActiveCityPageSlugs().catch(() => []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: CityPageRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const view = await getCityPageView(slug);
  if (!view) return {};

  return {
    title: view.cityPage.metaTitle,
    description: view.cityPage.metaDescription,
  };
}

export default async function CityPageRoute({ params }: CityPageRouteProps) {
  const { slug } = await params;
  const view = await getCityPageView(slug);
  if (!view) notFound();

  const { cityPage, city, state, rto, featuredModels, categorySections, brands, dealers, relatedCityPages } = view;

  return (
    <main className="bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        {cityPage.heroImageUrl ? (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="h-full w-full object-cover opacity-35" src={cityPage.heroImageUrl} alt={cityPage.title} />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-emerald-950/60" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(190,242,100,0.25),transparent_28%),linear-gradient(135deg,#020617,#052e2b_55%,#0f172a)]" />
        )}
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_360px] lg:py-20">
          <div>
            <div className="inline-flex rounded-full bg-lime-300 px-4 py-2 text-xs font-black uppercase text-slate-950">
              {city.name} vehicle prices
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-tight tracking-normal md:text-7xl">
              {cityPage.h1}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-100">{cityPage.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-lime-300" href={`/?type=cars&city=${city.slug}#vehicle-home`}>
                Check prices
              </Link>
              <Link className="rounded-full border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10" href={`/discover?type=cars&city=${city.slug}`}>
                Explore models
              </Link>
            </div>
          </div>
          <aside className="rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-black uppercase text-lime-300">City context</p>
            <div className="mt-4 grid gap-3">
              {[
                ["State", state?.name ?? "Configured state"],
                ["Tier", city.tier ?? "City"],
                ["RTO", rto?.code ?? city.rtoStateCode ?? "Mapped RTO"],
                ["Live models", `${featuredModels.length}+ shown`],
              ].map(([label, value]) => (
                <div className="rounded-md bg-white/10 p-4" key={label}>
                  <div className="text-xs font-bold uppercase text-slate-300">{label}</div>
                  <div className="mt-1 text-xl font-black text-white">{value}</div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-10">
            <section>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase text-emerald-700">Featured in {city.name}</p>
                  <h2 className="mt-1 text-3xl font-black text-slate-950">Popular on-road price checks</h2>
                </div>
                <Link className="text-sm font-black text-emerald-700 hover:text-slate-950" href={`/discover?type=cars&city=${city.slug}`}>
                  View all
                </Link>
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {featuredModels.map((card) => (
                  <ModelCard card={card} citySlug={city.slug} key={`${card.model.id}-${card.pricing.variant.id}`} />
                ))}
              </div>
            </section>

            {categorySections.map((section) => (
              <section key={section.category.id}>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase text-emerald-700">{section.category.name}</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">{section.category.name} models in {city.name}</h2>
                  </div>
                  <Link className="text-sm font-black text-emerald-700 hover:text-slate-950" href={`/discover?type=${section.category.slug.replace("-vehicles", "")}&city=${city.slug}`}>
                    View all
                  </Link>
                </div>
                <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {section.models.map((card) => (
                    <ModelCard card={card} citySlug={city.slug} key={`${section.category.id}-${card.model.id}`} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <aside className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase text-emerald-700">Browse brands</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Brands in {city.name}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {brands.map((brand) => (
                  <Link className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center hover:border-lime-300 hover:bg-lime-50" href={`/brands/${brand.slug}`} key={brand.id}>
                    <BrandLogo className="mx-auto h-16 w-28" logoUrl={brand.logoUrl} name={brand.name} />
                    <div className="mt-2 text-sm font-black text-slate-950">{brand.name}</div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase text-emerald-700">Dealers</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Mapped dealers</h2>
              <div className="mt-4 space-y-3">
                {dealers.map((dealer) => (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4" key={dealer.id}>
                    <div className="text-base font-black text-slate-950">{dealer.name}</div>
                    <div className="mt-1 text-sm text-slate-600">{dealer.area}, {city.name}</div>
                    <div className="mt-2 text-xs font-black uppercase text-emerald-700">
                      {dealer.verified ? "Verified dealer" : "Dealer"}
                    </div>
                  </div>
                ))}
                {!dealers.length ? (
                  <p className="text-sm leading-6 text-slate-600">Dealer mapping is not added for this city yet. Admin can map dealers from the dealer module.</p>
                ) : null}
              </div>
            </section>

            {relatedCityPages.length ? (
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase text-emerald-700">Other cities</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {relatedCityPages.map((page) => (
                    <Link className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-lime-300 hover:text-slate-950" href={`/city/${page.slug}`} key={page.id}>
                      {page.title.replace("Vehicle on-road prices in ", "")}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>

        {cityPage.body ? (
          <section className="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase text-emerald-700">City guide</p>
            <div className="mt-2 max-w-4xl text-base leading-8 text-slate-700">{cityPage.body}</div>
          </section>
        ) : null}

        {cityPage.faq.length ? (
          <section className="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase text-emerald-700">FAQs</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Questions about {city.name} prices</h2>
            <div className="mt-5 divide-y divide-slate-100">
              {cityPage.faq.map((item) => (
                <details className="group py-4" key={item.question}>
                  <summary className="cursor-pointer text-lg font-black text-slate-950">{item.question}</summary>
                  <p className="mt-3 leading-7 text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
