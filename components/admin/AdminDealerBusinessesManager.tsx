"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, UserPlus } from "lucide-react";
import { adminFieldClass, patchAdminJson, postAdminJson } from "@/components/admin/admin-form-utils";
import { DealerAdminSubnav, dealerStatusPill } from "@/components/admin/dealer-admin-shared";
import { slugify } from "@/lib/utils/format";
import type { DealerBusiness, DealerVerificationStatus } from "@/types/automobile";

type Props = {
  businesses: DealerBusiness[];
};

const verificationPill: Record<DealerVerificationStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  verified: "bg-lime-100 text-lime-900",
  rejected: "bg-red-50 text-red-700",
};

export function AdminDealerBusinessesManager({ businesses }: Props) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [businessSlug, setBusinessSlug] = useState("");
  const [businessLogoUrl, setBusinessLogoUrl] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessVerified, setBusinessVerified] = useState(true);

  const [loginBusinessId, setLoginBusinessId] = useState(businesses[0]?.id ?? "");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [statusFilter, setStatusFilter] = useState<"all" | DealerVerificationStatus>("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [moderating, setModerating] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");

  const filteredBusinesses = useMemo(
    () => (statusFilter === "all" ? businesses : businesses.filter((b) => b.verificationStatus === statusFilter)),
    [businesses, statusFilter],
  );

  async function approve(id: string) {
    setModerating(id);
    setError("");
    try {
      await patchAdminJson("/api/admin/dealers", { action: "approve", id });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to approve dealer business");
    } finally {
      setModerating(null);
    }
  }

  async function reject(id: string) {
    if (rejectReason.trim().length < 3) {
      setError("Enter a rejection reason (at least 3 characters).");
      return;
    }
    setModerating(id);
    setError("");
    try {
      await patchAdminJson("/api/admin/dealers", { action: "reject", id, reason: rejectReason.trim() });
      setRejectingId(null);
      setRejectReason("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to reject dealer business");
    } finally {
      setModerating(null);
    }
  }

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
      setMessage("Dealer business login created.");
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
            <h1 className="mt-1 text-2xl font-black text-slate-950">Dealer businesses</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Keep the business master list clean. Create new dealer businesses here and issue their master login from the same list page.
            </p>
          </div>
          <DealerAdminSubnav />
        </div>
        {message ? <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{message}</p> : null}
        {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-lime-300 text-slate-950">
                <Building2 size={20} />
              </span>
              <div>
                <p className="text-xs font-black uppercase text-emerald-700">List</p>
                <h2 className="text-xl font-black text-slate-950">Business list</h2>
              </div>
            </div>
            <select className={adminFieldClass} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} value={statusFilter}>
              <option value="pending">Pending review</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="all">All statuses</option>
            </select>
          </div>

          <div className="mt-4 grid gap-3">
            {filteredBusinesses.length ? filteredBusinesses.map((business) => (
              <div className="rounded-lg border border-slate-200 p-3" key={business.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-black text-slate-950">{business.name}</div>
                    <div className="text-xs font-bold text-slate-500">/{business.slug}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {dealerStatusPill(business.active, business.verified)}
                    <span className={`rounded-full px-2 py-1 text-[11px] font-black ${verificationPill[business.verificationStatus]}`}>
                      {business.verificationStatus}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-500">
                  {business.phone || "No phone"} / {business.email || "No email"}
                </div>
                {business.verificationStatus === "rejected" && business.rejectionReason && (
                  <p className="mt-2 rounded-md bg-red-50 px-2 py-1.5 text-xs font-bold text-red-700">{business.rejectionReason}</p>
                )}

                {business.verificationStatus !== "verified" && (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <button
                      className="text-xs font-bold text-emerald-700 hover:underline disabled:opacity-50"
                      disabled={moderating === business.id}
                      onClick={() => approve(business.id)}
                      type="button"
                    >
                      Approve
                    </button>
                    <button
                      className="text-xs font-bold text-red-600 hover:underline"
                      onClick={() => setRejectingId(rejectingId === business.id ? null : business.id)}
                      type="button"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {rejectingId === business.id && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      className={`${adminFieldClass} w-64`}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Rejection reason"
                      value={rejectReason}
                    />
                    <button
                      className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
                      disabled={moderating === business.id || rejectReason.trim().length < 3}
                      onClick={() => reject(business.id)}
                      type="button"
                    >
                      Confirm reject
                    </button>
                    <button className="text-xs font-bold text-slate-500 hover:underline" onClick={() => setRejectingId(null)} type="button">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )) : (
              <div className="rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-500">No dealer business matches this filter.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={saveBusiness}>
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-lime-300 text-slate-950">
                <Plus size={20} />
              </span>
              <div>
                <p className="text-xs font-black uppercase text-emerald-700">Create new</p>
                <h2 className="text-xl font-black text-slate-950">New dealer business</h2>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <input className={adminFieldClass} value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Business name" required />
              <input className={adminFieldClass} value={businessSlug} onChange={(event) => setBusinessSlug(event.target.value)} placeholder="Slug auto-generates if blank" />
              <input className={adminFieldClass} value={businessLogoUrl} onChange={(event) => setBusinessLogoUrl(event.target.value)} placeholder="Logo URL optional" />
              <input className={adminFieldClass} value={businessPhone} onChange={(event) => setBusinessPhone(event.target.value)} placeholder="Business phone optional" />
              <input className={adminFieldClass} value={businessEmail} onChange={(event) => setBusinessEmail(event.target.value)} placeholder="Business email optional" type="email" />
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input checked={businessVerified} onChange={(event) => setBusinessVerified(event.target.checked)} type="checkbox" />
                Verified business
              </label>
              <button className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400" disabled={saving === "business"}>
                <Plus size={16} /> {saving === "business" ? "Saving" : "Create business"}
              </button>
            </div>
          </form>

          <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={saveBusinessLogin}>
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-lime-300 text-slate-950">
                <UserPlus size={20} />
              </span>
              <div>
                <p className="text-xs font-black uppercase text-emerald-700">Business access</p>
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
                <UserPlus size={16} /> {saving === "business-login" ? "Saving" : "Create login"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
