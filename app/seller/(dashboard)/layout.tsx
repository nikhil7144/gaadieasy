import { redirect } from "next/navigation";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { SellerResendVerificationButton } from "@/components/seller/SellerResendVerificationButton";
import { SellerShell } from "@/components/seller/SellerShell";
import { getSellerAccessContext } from "@/lib/services/seller-auth";

export default async function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getSellerAccessContext();
  if (!context) redirect("/gaadigear/sell/login");

  const { seller } = context;
  const roleLabel = context.sellerUser.role === "seller_owner" ? "Owner login" : "Staff login";

  if (!seller.emailVerifiedAt) {
    return (
      <StatusScreen title="Verify your email" tone="amber">
        <p>
          We sent a confirmation link to <span className="font-bold text-slate-950">{context.userEmail}</span>. Click it to
          continue — we can&apos;t review your application until your email is verified.
        </p>
        <div className="mt-4">
          <SellerResendVerificationButton email={context.userEmail} />
        </div>
      </StatusScreen>
    );
  }

  // Pending review no longer blocks the dashboard -- the seller can set up
  // products, KYC docs, and settings while admin reviews the account; only a
  // banner reminds them the account itself isn't approved yet.
  if (seller.status === "onboarding" && seller.kycStatus === "pending_review") {
    return (
      <SellerShell businessName={seller.businessName} roleLabel={roleLabel} userEmail={context.userEmail}>
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          Your application is under review — typically approved within 1-2 business days. You can set up products, KYC
          documents, and store settings in the meantime.
        </div>
        {children}
      </SellerShell>
    );
  }

  if (seller.kycStatus === "rejected") {
    return (
      <StatusScreen title="Application needs changes" tone="red">
        <p className="mb-2">Your application was not approved.</p>
        {seller.kycRejectionReason && <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{seller.kycRejectionReason}</p>}
        <p className="mt-3">Please update your details and documents, then contact support to request another review.</p>
      </StatusScreen>
    );
  }

  if (seller.status === "suspended") {
    return (
      <StatusScreen title="Account suspended" tone="red">
        <p>Your seller account has been suspended. Contact support for details.</p>
      </StatusScreen>
    );
  }

  return (
    <SellerShell businessName={seller.businessName} roleLabel={roleLabel} userEmail={context.userEmail}>
      {children}
    </SellerShell>
  );
}

function StatusScreen({ title, tone, children }: { title: string; tone: "amber" | "red"; children: React.ReactNode }) {
  const toneClass = tone === "amber" ? "border-amber-200 text-amber-700" : "border-red-200 text-red-700";
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <div className={`max-w-lg rounded-lg border bg-white p-6 shadow-sm ${toneClass}`}>
        <p className="text-xs font-black uppercase">GaadiGear seller</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950">{title}</h1>
        <div className="mt-2 text-sm leading-6 text-slate-600">{children}</div>
        <div className="mt-4">
          <AdminSignOutButton />
        </div>
      </div>
    </main>
  );
}
