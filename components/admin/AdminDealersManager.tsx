"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, GitBranch, Plus, Store } from "lucide-react";
import { adminFieldClass, postAdminJson } from "@/components/admin/admin-form-utils";
import { slugify } from "@/lib/utils/format";
import type { Brand, City, Dealer, DealerBrandMapping, DealerBusiness } from "@/types/automobile";

type AdminDealersManagerProps = {
  brands: Brand[];
  businesses: DealerBusiness[];
  cities: City[];
  dealers: Dealer[];
  mappings: DealerBrandMapping[];
};

function statusPill(active: boolean, verified?: boolean) {
  return (
    <div className="flex flex-wrap gap-1">
      <span className={`rounded-full px-2 py-1 text-[11px] font-black ${active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
        {active ? "Active" : "Inactive"}
      </span>
      {verified !== undefined ? (
        <span className={`rounded-full px-2 py-1 text-[11px] font-black ${verified ? "bg-lime-100 text-lime-900" : "bg-amber-50 text-amber-700"}`}>
          {verified ? "Verified" : "Unverified"}
        </span>
      ) : null}
    </div>
  );
}

export function AdminDealersManager({ brands, businesses, cities, dealers, mappings }: AdminDealersManagerProps) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [businessSlug, setBusinessSlug] = useState("");
  const [businessLogoUrl, setBusinessLogoUrl] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessVerified, setBusinessVerified] = useState(true);

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
  const [loginBusinessId, setLoginBusinessId] = useState(businesses[0]?.id ?? "");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");

  async function saveBusiness(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving("business");
    setMessage("");
    setError("");

    try {
      await postAdminJson("/api/admin/dealers", {
        action: "create_business",
        business: {
          name: businessName,
          slug: businessSlug || slugify(businessName),
          logoUrl: businessLogoUrl,
          phone: businessPhone,
          email: businessEmail,
          active: true,
          verified: businessVerified,
        },
      });
      setBusinessName("");
      setBusinessSlug("");
      setBusinessLogoUrl("");
      setBusinessPhone("");
      setBusinessEmail("");
      setBusinessVerified(true);
      setMessage("Dealer business created.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create dealer business");
    } finally {
      setSaving("");
    }
  }

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
      setMessage("Brand-city dealer mapping saved.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save dealer mapping");
    } finally {
      setSaving("");
    }
  }

  async function saveBusinessLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving("business-login");
    setMessage("");
    setError("");

    try {
      await postAdminJson("/api/admin/dealers", {
        action: "create_business_login",
        login: {
          dealerBusinessId: loginBusinessId,
          email: loginEmail,
          password: loginPassword,
        },
      });
      setLoginEmail("");
      setLoginPassword("");
      setMessage("Dealer business login created. These credentials can now use dealer sign-in.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create dealer business login");
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
            <h1 className="mt-1 text-2xl font-black text-slate-950">Dealer setup</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Create one dealer business master, add multiple showrooms under it, then map each showroom to brands and cities for lead routing.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <div className="text-xl font-black text-slate-950">{businesses.length}</div>
              <div className="text-[11px] font-bold text-slate-500">Businesses</div>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <div className="text-xl font-black text-slate-950">{dealers.length}</div>
              <div className="text-[11px] font-bold text-slate-500">Showrooms</div>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <div className="text-xl font-black text-slate-950">{mappings.length}</div>
              <div className="text-[11px] font-bold text-slate-500">Mappings</div>
            </div>
          </div>
        </div>
        {message ? <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{message}</p> : null}
        {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-4">
        <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={saveBusiness}>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-lime-300 text-slate-950"><Building2 size={20} /></span>
            <div>
              <p className="text-xs font-black uppercase text-emerald-700">Master dealer</p>
              <h2 className="text-xl font-black text-slate-950">Create dealer business</h2>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            <input className={adminFieldClass} value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Business name, e.g. Greenline Motors" required />
            <input className={adminFieldClass} value={businessSlug} onChange={(event) => setBusinessSlug(event.target.value)} placeholder="Slug auto-generates if blank" />
            <input className={adminFieldClass} value={businessLogoUrl} onChange={(event) => setBusinessLogoUrl(event.target.value)} placeholder="Logo URL optional" />
            <input className={adminFieldClass} value={businessPhone} onChange={(event) => setBusinessPhone(event.target.value)} placeholder="Business phone optional" />
            <input className={adminFieldClass} value={businessEmail} onChange={(event) => setBusinessEmail(event.target.value)} placeholder="Business email optional" type="email" />
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input checked={businessVerified} onChange={(event) => setBusinessVerified(event.target.checked)} type="checkbox" />
              Verified business
            </label>
            <button className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400" disabled={saving === "business"}>
              <Plus size={16} /> {saving === "business" ? "Saving" : "Add business"}
            </button>
          </div>
        </form>

        <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={saveDealer}>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-lime-300 text-slate-950"><Store size={20} /></span>
            <div>
              <p className="text-xs font-black uppercase text-emerald-700">Showroom/outlet</p>
              <h2 className="text-xl font-black text-slate-950">Add dealer showroom</h2>
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
              <Plus size={16} /> {saving === "dealer" ? "Saving" : "Add showroom"}
            </button>
          </div>
        </form>

        <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={saveMapping}>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-lime-300 text-slate-950"><GitBranch size={20} /></span>
            <div>
              <p className="text-xs font-black uppercase text-emerald-700">Lead routing</p>
              <h2 className="text-xl font-black text-slate-950">Map brand and city</h2>
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
              <Plus size={16} /> {saving === "mapping" ? "Saving" : "Save mapping"}
            </button>
          </div>
        </form>

        <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={saveBusinessLogin}>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-lime-300 text-slate-950"><Plus size={20} /></span>
            <div>
              <p className="text-xs font-black uppercase text-emerald-700">Dealer login</p>
              <h2 className="text-xl font-black text-slate-950">Create business login</h2>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            <select className={adminFieldClass} value={loginBusinessId} onChange={(event) => setLoginBusinessId(event.target.value)} required>
              <option value="">Select dealer business</option>
              {businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}
            </select>
            <input className={adminFieldClass} value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder="Unique login email" type="email" required />
            <input className={adminFieldClass} value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder="Password (min 8 chars)" type="password" minLength={8} required />
            <button className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400" disabled={saving === "business-login"}>
              <Plus size={16} /> {saving === "business-login" ? "Saving" : "Create login"}
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Dealer businesses</h2>
          <div className="mt-4 grid gap-3">
            {businesses.map((business) => (
              <div className="rounded-lg border border-slate-200 p-3" key={business.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-black text-slate-950">{business.name}</div>
                    <div className="text-xs font-bold text-slate-500">/{business.slug}</div>
                  </div>
                  {statusPill(business.active, business.verified)}
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-500">{business.phone || "No phone"} / {business.email || "No email"}</div>
              </div>
            ))}
            {!businesses.length ? <div className="rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-500">No dealer business created yet.</div> : null}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Dealer showrooms</h2>
          <div className="mt-4 grid gap-3">
            {dealers.map((dealer) => {
              const city = cities.find((item) => item.id === dealer.cityId);
              const business = businesses.find((item) => item.id === dealer.dealerBusinessId);
              return (
                <div className="rounded-lg border border-slate-200 p-3" key={dealer.id}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-black text-slate-950">{dealer.name}</div>
                      <div className="text-xs font-bold text-slate-500">{business?.name ?? "No business"} / {city?.name ?? "Unknown city"}</div>
                    </div>
                    {statusPill(dealer.active, dealer.verified)}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-500">{dealer.area || "No area"} / {dealer.contactPerson || "No contact"}</div>
                  <div className="mt-2 text-xs font-bold text-emerald-700">Priority {dealer.priority}</div>
                </div>
              );
            })}
            {!dealers.length ? <div className="rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-500">No showroom created yet.</div> : null}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Brand-city mappings</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {mappings.map((mapping) => {
            const dealer = dealers.find((item) => item.id === mapping.dealerId);
            const brand = brands.find((item) => item.id === mapping.brandId);
            const city = cities.find((item) => item.id === mapping.cityId);
            return (
              <div className="rounded-lg border border-slate-200 p-3" key={mapping.id}>
                <div className="text-xs font-black uppercase text-emerald-700">{city?.name ?? "Unknown city"}</div>
                <div className="mt-1 font-black text-slate-950">{brand?.name ?? "Unknown brand"}</div>
                <div className="mt-1 text-sm font-semibold text-slate-500">{dealer?.name ?? "Unknown showroom"}</div>
                <div className="mt-2">{statusPill(mapping.active)}</div>
              </div>
            );
          })}
          {!mappings.length ? <div className="rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-500">No brand-city mapping created yet.</div> : null}
        </div>
      </section>
    </div>
  );
}
