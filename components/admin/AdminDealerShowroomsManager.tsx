"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, Plus, Store } from "lucide-react";
import { adminFieldClass, postAdminJson } from "@/components/admin/admin-form-utils";
import { DealerAdminSubnav, dealerStatusPill } from "@/components/admin/dealer-admin-shared";
import { slugify } from "@/lib/utils/format";
import type { Brand, City, Dealer, DealerBrandMapping, DealerBusiness } from "@/types/automobile";

type Props = {
  brands: Brand[];
  businesses: DealerBusiness[];
  cities: City[];
  dealers: Dealer[];
  mappings: DealerBrandMapping[];
};

export function AdminDealerShowroomsManager({ brands, businesses, cities, dealers, mappings }: Props) {
  const router = useRouter();
  const [dealerBusinessId, setDealerBusinessId] = useState(businesses[0]?.id ?? "");
  const [dealerName, setDealerName] = useState("");
  const [dealerSlug, setDealerSlug] = useState("");
  const [dealerLogoUrl, setDealerLogoUrl] = useState("");
  const [dealerCityId, setDealerCityId] = useState(cities[0]?.id ?? "");
  const [dealerArea, setDealerArea] = useState("");
  const [dealerContactPerson, setDealerContactPerson] = useState("");
  const [dealerPhone, setDealerPhone] = useState("");
  const [dealerEmail, setDealerEmail] = useState("");
  const [dealerGstNumber, setDealerGstNumber] = useState("");
  const [dealerPriority, setDealerPriority] = useState(0);
  const [dealerVerified, setDealerVerified] = useState(true);

  const [mappingDealerId, setMappingDealerId] = useState(dealers[0]?.id ?? "");
  const [mappingBrandId, setMappingBrandId] = useState(brands[0]?.id ?? "");
  const [mappingCityId, setMappingCityId] = useState(cities[0]?.id ?? "");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");

  const mappedDealerIds = useMemo(() => new Set(mappings.map((item) => item.dealerId)), [mappings]);

  async function saveDealer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving("dealer");
    setMessage("");
    setError("");

    try {
      await postAdminJson("/api/admin/dealers", {
        action: "create_showroom",
        dealer: {
          dealerBusinessId,
          name: dealerName,
          slug: dealerSlug || slugify(dealerName),
          logoUrl: dealerLogoUrl,
          cityId: dealerCityId,
          area: dealerArea,
          contactPerson: dealerContactPerson,
          phone: dealerPhone,
          email: dealerEmail,
          gstNumber: dealerGstNumber,
          active: true,
          verified: dealerVerified,
          priority: dealerPriority,
        },
      });
      setDealerName("");
      setDealerSlug("");
      setDealerLogoUrl("");
      setDealerArea("");
      setDealerContactPerson("");
      setDealerPhone("");
      setDealerEmail("");
      setDealerGstNumber("");
      setDealerPriority(0);
      setDealerVerified(true);
      setMessage("Dealer showroom created.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create showroom");
    } finally {
      setSaving("");
    }
  }

  async function saveMapping(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving("mapping");
    setMessage("");
    setError("");

    try {
      await postAdminJson("/api/admin/dealers", {
        action: "create_mapping",
        mapping: {
          dealerId: mappingDealerId,
          brandId: mappingBrandId,
          cityId: mappingCityId,
          active: true,
        },
      });
      setMessage("Brand-city mapping saved.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save mapping");
    } finally {
      setSaving("");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-emerald-700">Dealer operations</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">Showrooms</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Add showrooms under dealer businesses, then map them to brand and city combinations for routing and public dealer visibility.
            </p>
          </div>
          <DealerAdminSubnav />
        </div>
        {message ? <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{message}</p> : null}
        {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-lime-300 text-slate-950">
              <Store size={20} />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-emerald-700">List</p>
              <h2 className="text-xl font-black text-slate-950">Showroom list</h2>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {dealers.length ? dealers.map((dealer) => {
              const city = cities.find((item) => item.id === dealer.cityId);
              const business = businesses.find((item) => item.id === dealer.dealerBusinessId);
              const mapped = mappedDealerIds.has(dealer.id);

              return (
                <div className="rounded-lg border border-slate-200 p-3" key={dealer.id}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-black text-slate-950">{dealer.name}</div>
                      <div className="text-xs font-bold text-slate-500">
                        {business?.name ?? "No business"} / {city?.name ?? "Unknown city"}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {dealerStatusPill(dealer.active, dealer.verified)}
                      <span className={`rounded-full px-2 py-1 text-[11px] font-black ${mapped ? "bg-lime-100 text-lime-900" : "bg-amber-50 text-amber-700"}`}>
                        {mapped ? "Mapped" : "Unmapped"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-500">
                    {dealer.area || "No area"} / {dealer.contactPerson || "No contact"} / Priority {dealer.priority}
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-500">No showroom created yet.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={saveDealer}>
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-lime-300 text-slate-950">
                <Plus size={20} />
              </span>
              <div>
                <p className="text-xs font-black uppercase text-emerald-700">Create new</p>
                <h2 className="text-xl font-black text-slate-950">New showroom</h2>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <select className={adminFieldClass} value={dealerBusinessId} onChange={(event) => setDealerBusinessId(event.target.value)}>
                <option value="">No business selected</option>
                {businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}
              </select>
              <input className={adminFieldClass} value={dealerName} onChange={(event) => setDealerName(event.target.value)} placeholder="Showroom name" required />
              <input className={adminFieldClass} value={dealerSlug} onChange={(event) => setDealerSlug(event.target.value)} placeholder="Slug auto-generates if blank" />
              <select className={adminFieldClass} value={dealerCityId} onChange={(event) => setDealerCityId(event.target.value)} required>
                {cities.map((city) => <option value={city.id} key={city.id}>{city.name}</option>)}
              </select>
              <input className={adminFieldClass} value={dealerArea} onChange={(event) => setDealerArea(event.target.value)} placeholder="Area / locality" />
              <input className={adminFieldClass} value={dealerContactPerson} onChange={(event) => setDealerContactPerson(event.target.value)} placeholder="Contact person" />
              <input className={adminFieldClass} value={dealerPhone} onChange={(event) => setDealerPhone(event.target.value)} placeholder="Phone" />
              <input className={adminFieldClass} value={dealerEmail} onChange={(event) => setDealerEmail(event.target.value)} placeholder="Email" type="email" />
              <input className={adminFieldClass} value={dealerGstNumber} onChange={(event) => setDealerGstNumber(event.target.value)} placeholder="GST number optional" />
              <input className={adminFieldClass} value={dealerLogoUrl} onChange={(event) => setDealerLogoUrl(event.target.value)} placeholder="Logo URL optional" />
              <input className={adminFieldClass} value={dealerPriority} onChange={(event) => setDealerPriority(Number(event.target.value))} placeholder="Lead priority" type="number" />
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input checked={dealerVerified} onChange={(event) => setDealerVerified(event.target.checked)} type="checkbox" />
                Verified showroom
              </label>
              <button className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400" disabled={saving === "dealer"}>
                <Plus size={16} /> {saving === "dealer" ? "Saving" : "Create showroom"}
              </button>
            </div>
          </form>

          <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={saveMapping}>
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-lime-300 text-slate-950">
                <GitBranch size={20} />
              </span>
              <div>
                <p className="text-xs font-black uppercase text-emerald-700">Lead routing</p>
                <h2 className="text-xl font-black text-slate-950">Create mapping</h2>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <select className={adminFieldClass} value={mappingDealerId} onChange={(event) => setMappingDealerId(event.target.value)} required>
                <option value="">Select showroom</option>
                {dealers.map((dealer) => <option value={dealer.id} key={dealer.id}>{dealer.name}</option>)}
              </select>
              <select className={adminFieldClass} value={mappingBrandId} onChange={(event) => setMappingBrandId(event.target.value)} required>
                {brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}
              </select>
              <select className={adminFieldClass} value={mappingCityId} onChange={(event) => setMappingCityId(event.target.value)} required>
                {cities.map((city) => <option value={city.id} key={city.id}>{city.name}</option>)}
              </select>
              <button className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400" disabled={saving === "mapping" || !dealers.length}>
                <GitBranch size={16} /> {saving === "mapping" ? "Saving" : "Create mapping"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
