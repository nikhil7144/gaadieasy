import { Suspense } from "react";
import Link from "next/link";
import { DealerSignupWizard } from "@/components/dealer/DealerSignupWizard";
import { AuthFormSkeleton } from "@/components/shared/AuthFormSkeleton";
import { BrandLockup } from "@/components/shared/BrandLockup";
import { getSlimCatalog } from "@/lib/repositories/vehicle-data";

export default async function DealerSignupPage() {
  const catalog = await getSlimCatalog();

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto grid max-w-5xl items-start gap-8 md:grid-cols-[1fr_420px]">
        <section className="rounded-lg bg-slate-950 p-8 text-white">
          <BrandLockup href="/" size="hero" />
          <Link href="/dealer/login" className="inline-flex rounded-full bg-lime-300 px-3 py-1 text-xs font-black uppercase text-slate-950">
            Already registered? Log in
          </Link>
          <h2 className="mt-5 text-4xl font-black">Get your showroom in front of buyers already comparing prices.</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Register your dealer business, pick the brands you sell, and appear on Gaadieasy once your account is
            verified.
          </p>
        </section>
        <Suspense fallback={<AuthFormSkeleton />}>
          <DealerSignupWizard brands={catalog.brands} cities={catalog.cities} />
        </Suspense>
      </div>
    </main>
  );
}
