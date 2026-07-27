"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/seller/FormField";
import { cardClass, fieldClass, microLabelClass, primaryButtonClass } from "@/components/seller/dashboardStyles";
import type { Seller, SellerBankDetails, SellerKycDocument, SellerShippingSettingsRecord } from "@/types/automobile";

const KYC_STATUS_LABEL: Record<Seller["kycStatus"], string> = {
  pending_review: "Pending review",
  verified: "Verified",
  rejected: "Needs changes",
};

const KYC_STATUS_TONE: Record<Seller["kycStatus"], string> = {
  pending_review: "bg-amber-50 text-amber-700",
  verified: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

async function sendJson(url: string, method: "PATCH" | "PUT", body: unknown) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload;
}

export function SellerSettingsForm({
  seller,
  bankDetails,
  kycDocuments,
  shippingSettings,
}: {
  seller: Seller;
  bankDetails: SellerBankDetails | null;
  kycDocuments: SellerKycDocument[];
  shippingSettings: SellerShippingSettingsRecord | null;
}) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(seller.businessName);
  const [brandName, setBrandName] = useState(seller.brandName ?? "");
  const [gstin, setGstin] = useState(seller.gstin ?? "");
  const [pan, setPan] = useState(seller.pan ?? "");
  const [contactPhone, setContactPhone] = useState(seller.contactPhone ?? "");
  const [contactEmail, setContactEmail] = useState(seller.contactEmail ?? "");
  const [logoUrl, setLogoUrl] = useState(seller.logoUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(seller.bannerUrl ?? "");
  const [about, setAbout] = useState(seller.about ?? "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [accountHolder, setAccountHolder] = useState(bankDetails?.accountHolder ?? "");
  const [ifsc, setIfsc] = useState(bankDetails?.ifsc ?? "");
  const [upiId, setUpiId] = useState(bankDetails?.upiId ?? "");
  const [payoutCycle, setPayoutCycle] = useState(bankDetails?.payoutCycle ?? "weekly");
  const [accountNumberEnc, setAccountNumberEnc] = useState("");

  const [shipsPanIndia, setShipsPanIndia] = useState(shippingSettings?.shipsPanIndia ?? true);
  const [excludedStates, setExcludedStates] = useState((shippingSettings?.excludedStates ?? []).join(", "));
  const [excludedPincodes, setExcludedPincodes] = useState((shippingSettings?.excludedPincodes ?? []).join(", "));
  const [feeType, setFeeType] = useState(shippingSettings?.feeType ?? "flat");
  const [flatFee, setFlatFee] = useState(String(shippingSettings?.flatFee ?? 0));
  const [freeShippingAbove, setFreeShippingAbove] = useState(shippingSettings?.freeShippingAbove ? String(shippingSettings.freeShippingAbove) : "");
  const [standardDeliveryDays, setStandardDeliveryDays] = useState(String(shippingSettings?.standardDeliveryDays ?? 5));
  const [codAvailable, setCodAvailable] = useState(shippingSettings?.codAvailable ?? false);

  const [docs, setDocs] = useState(kycDocuments);
  const [docType, setDocType] = useState("gst_certificate");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [savingShipping, setSavingShipping] = useState(false);
  const [error, setError] = useState("");

  async function saveBusiness() {
    setSavingBusiness(true);
    setError("");
    try {
      await sendJson("/api/seller/onboarding", "PATCH", {
        step: "business_details",
        businessName,
        brandName,
        gstin,
        pan,
        contactPhone,
        contactEmail,
        logoUrl,
        bannerUrl,
        about,
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save business details");
    } finally {
      setSavingBusiness(false);
    }
  }

  async function uploadImage(file: File, onDone: (url: string) => void, setUploading: (v: boolean) => void) {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/seller/upload-image", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      onDone(payload.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to upload image");
    } finally {
      setUploading(false);
    }
  }

  async function uploadKycDoc(file: File) {
    setUploadingDoc(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/seller/upload-document", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);

      const added = await sendJson("/api/seller/onboarding", "PATCH", { step: "kyc_document", docType, fileUrl: payload.url });
      setDocs((prev) => [...prev, added.document as SellerKycDocument]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to upload document");
    } finally {
      setUploadingDoc(false);
      if (docFileInputRef.current) docFileInputRef.current.value = "";
    }
  }

  async function saveBank() {
    setSavingBank(true);
    setError("");
    try {
      await sendJson("/api/seller/onboarding", "PATCH", {
        step: "bank_details",
        accountHolder,
        ifsc,
        upiId,
        payoutCycle,
        ...(accountNumberEnc ? { accountNumberEnc } : {}),
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save bank details");
    } finally {
      setSavingBank(false);
    }
  }

  async function saveShipping() {
    setSavingShipping(true);
    setError("");
    try {
      await sendJson("/api/seller/shipping-settings", "PUT", {
        shipsPanIndia,
        excludedStates: excludedStates.split(",").map((s) => s.trim()).filter(Boolean),
        excludedPincodes: excludedPincodes.split(",").map((s) => s.trim()).filter(Boolean),
        feeType,
        flatFee: Number(flatFee) || 0,
        freeShippingAbove: freeShippingAbove ? Number(freeShippingAbove) : undefined,
        standardDeliveryDays: Number(standardDeliveryDays) || 5,
        codAvailable,
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save shipping settings");
    } finally {
      setSavingShipping(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-lg font-black text-[#171717]">Settings</h1>

      {error && <p className="text-sm font-bold text-[#ef4444]">{error}</p>}

      <section className={`${cardClass} p-4`}>
        <h2 className={`mb-3 ${microLabelClass}`}>Business details</h2>
        <div className="grid gap-2 md:grid-cols-2">
          <FormField label="Business name">
            <input className={fieldClass} onChange={(e) => setBusinessName(e.target.value)} value={businessName} />
          </FormField>
          <FormField label="Storefront name">
            <input className={fieldClass} onChange={(e) => setBrandName(e.target.value)} value={brandName} />
          </FormField>
          <FormField label="GSTIN">
            <input className={fieldClass} onChange={(e) => setGstin(e.target.value)} value={gstin} />
          </FormField>
          <FormField label="PAN">
            <input className={fieldClass} onChange={(e) => setPan(e.target.value)} value={pan} />
          </FormField>
          <FormField label="Contact phone">
            <input className={fieldClass} onChange={(e) => setContactPhone(e.target.value)} value={contactPhone} />
          </FormField>
          <FormField label="Contact email (shown on your storefront)">
            <input className={fieldClass} onChange={(e) => setContactEmail(e.target.value)} type="email" value={contactEmail} />
          </FormField>
        </div>

        <h3 className={`mb-3 mt-5 ${microLabelClass}`}>Store profile (shown on your public storefront)</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-xs font-bold text-[#6b7280]">Logo</p>
            <button
              className="grid h-20 w-20 place-items-center overflow-hidden rounded-md border-2 border-dashed border-black/20 transition hover:border-[#3ecf8e] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={uploadingLogo}
              onClick={() => logoInputRef.current?.click()}
              type="button"
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="Logo" className="h-full w-full object-cover" src={logoUrl} />
              ) : (
                <span className="text-[10px] font-bold text-[#6b7280]">{uploadingLogo ? "…" : "+ Logo"}</span>
              )}
            </button>
            <input
              accept="image/*"
              className="hidden"
              disabled={uploadingLogo}
              onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], setLogoUrl, setUploadingLogo)}
              ref={logoInputRef}
              type="file"
            />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-bold text-[#6b7280]">Banner</p>
            <button
              className="flex h-20 w-full place-items-center overflow-hidden rounded-md border-2 border-dashed border-black/20 transition hover:border-[#3ecf8e] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={uploadingBanner}
              onClick={() => bannerInputRef.current?.click()}
              type="button"
            >
              {bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="Banner" className="h-full w-full object-cover" src={bannerUrl} />
              ) : (
                <span className="m-auto text-[10px] font-bold text-[#6b7280]">{uploadingBanner ? "…" : "+ Banner (wide image)"}</span>
              )}
            </button>
            <input
              accept="image/*"
              className="hidden"
              disabled={uploadingBanner}
              onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], setBannerUrl, setUploadingBanner)}
              ref={bannerInputRef}
              type="file"
            />
          </div>
          <FormField className="sm:col-span-2" label="About your business (shown on your storefront)">
            <textarea className={`${fieldClass} h-24 py-2`} onChange={(e) => setAbout(e.target.value)} value={about} />
          </FormField>
        </div>

        <button className={`${primaryButtonClass} mt-3`} disabled={savingBusiness} onClick={saveBusiness} type="button">
          {savingBusiness ? "Saving…" : "Save business details"}
        </button>
      </section>

      <section className={`${cardClass} p-4`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className={microLabelClass}>KYC documents</h2>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${KYC_STATUS_TONE[seller.kycStatus]}`}>
            {KYC_STATUS_LABEL[seller.kycStatus]}
          </span>
        </div>
        {seller.kycRejectionReason && seller.kycStatus === "rejected" && (
          <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-[#ef4444]">{seller.kycRejectionReason}</p>
        )}

        <ul className="mt-3 space-y-1 text-sm text-[#171717]">
          {docs.length === 0 && <li className="text-[#6b7280]">No documents uploaded yet.</li>}
          {docs.map((d) => (
            <li key={d.id}>
              {d.docType.replace("_", " ")}:{" "}
              <a className="font-bold text-[#3ecf8e] hover:underline" href={d.fileUrl} rel="noreferrer" target="_blank">
                View
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-end gap-2">
          <FormField label="Document type">
            <select className={fieldClass} onChange={(e) => setDocType(e.target.value)} value={docType}>
              <option value="gst_certificate">GST certificate</option>
              <option value="pan_card">PAN card</option>
              <option value="cancelled_cheque">Cancelled cheque</option>
              <option value="address_proof">Address proof</option>
            </select>
          </FormField>
          <button
            className="mb-0.5 shrink-0 rounded-md bg-black px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            disabled={uploadingDoc}
            onClick={() => docFileInputRef.current?.click()}
            type="button"
          >
            {uploadingDoc ? "Uploading…" : "+ Upload document"}
          </button>
          <input
            accept="image/*,application/pdf"
            className="hidden"
            disabled={uploadingDoc}
            onChange={(e) => e.target.files?.[0] && uploadKycDoc(e.target.files[0])}
            ref={docFileInputRef}
            type="file"
          />
        </div>
      </section>

      <section className={`${cardClass} p-4`}>
        <h2 className={`mb-3 ${microLabelClass}`}>Bank details</h2>
        <div className="grid gap-2 md:grid-cols-2">
          <FormField label="Account holder name">
            <input className={fieldClass} onChange={(e) => setAccountHolder(e.target.value)} value={accountHolder} />
          </FormField>
          <FormField label="Update account number">
            <input className={fieldClass} onChange={(e) => setAccountNumberEnc(e.target.value)} value={accountNumberEnc} />
          </FormField>
          <FormField label="IFSC">
            <input className={fieldClass} onChange={(e) => setIfsc(e.target.value)} value={ifsc} />
          </FormField>
          <FormField label="UPI ID">
            <input className={fieldClass} onChange={(e) => setUpiId(e.target.value)} value={upiId} />
          </FormField>
          <FormField label="Payout cycle">
            <select className={fieldClass} onChange={(e) => setPayoutCycle(e.target.value)} value={payoutCycle}>
              <option value="weekly">Weekly payout</option>
              <option value="biweekly">Biweekly payout</option>
              <option value="monthly">Monthly payout</option>
            </select>
          </FormField>
        </div>
        <button className={`${primaryButtonClass} mt-3`} disabled={savingBank} onClick={saveBank} type="button">
          {savingBank ? "Saving…" : "Save bank details"}
        </button>
      </section>

      <section className={`${cardClass} p-4`}>
        <h2 className={`mb-3 ${microLabelClass}`}>Shipping</h2>
        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[#171717]">
          <input checked={shipsPanIndia} onChange={(e) => setShipsPanIndia(e.target.checked)} type="checkbox" />
          Ships PAN-India
        </label>
        <div className="grid gap-2 md:grid-cols-2">
          <FormField label="Excluded states (comma-separated)">
            <input className={fieldClass} onChange={(e) => setExcludedStates(e.target.value)} value={excludedStates} />
          </FormField>
          <FormField label="Excluded pincodes (comma-separated)">
            <input className={fieldClass} onChange={(e) => setExcludedPincodes(e.target.value)} value={excludedPincodes} />
          </FormField>
          <FormField label="Shipping fee type">
            <select className={fieldClass} onChange={(e) => setFeeType(e.target.value as typeof feeType)} value={feeType}>
              <option value="flat">Flat fee</option>
              <option value="free">Free shipping</option>
              <option value="threshold">Free above a threshold</option>
            </select>
          </FormField>
          {feeType === "flat" && (
            <FormField label="Flat fee (₹)">
              <input className={fieldClass} onChange={(e) => setFlatFee(e.target.value)} type="number" value={flatFee} />
            </FormField>
          )}
          {feeType === "threshold" && (
            <>
              <FormField label="Fee below threshold (₹)">
                <input className={fieldClass} onChange={(e) => setFlatFee(e.target.value)} type="number" value={flatFee} />
              </FormField>
              <FormField label="Free above (₹)">
                <input className={fieldClass} onChange={(e) => setFreeShippingAbove(e.target.value)} type="number" value={freeShippingAbove} />
              </FormField>
            </>
          )}
          <FormField label="Standard delivery days">
            <input className={fieldClass} onChange={(e) => setStandardDeliveryDays(e.target.value)} type="number" value={standardDeliveryDays} />
          </FormField>
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm font-bold text-[#171717]">
          <input checked={codAvailable} onChange={(e) => setCodAvailable(e.target.checked)} type="checkbox" />
          Cash on delivery available
        </label>
        <button className={`${primaryButtonClass} mt-3`} disabled={savingShipping} onClick={saveShipping} type="button">
          {savingShipping ? "Saving…" : "Save shipping settings"}
        </button>
      </section>
    </div>
  );
}
