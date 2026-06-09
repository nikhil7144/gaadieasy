import Link from "next/link";
import { DealerLoginForm } from "@/components/dealer/DealerLoginForm";
import { BrandLockup } from "@/components/shared/BrandLockup";

export default function DealerLoginPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-[1fr_420px]">
        <section className="rounded-lg bg-slate-950 p-8 text-white">
          <BrandLockup href="/" size="hero" />
          <Link href="/" className="inline-flex rounded-full bg-lime-300 px-3 py-1 text-xs font-black uppercase text-slate-950">
            Dealer sign-in
          </Link>
          <h2 className="mt-5 text-4xl font-black">One dealer business, many showroom desks.</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Master dealer users can monitor all branch leads and offers. Showroom users work only on their mapped
            outlet leads.
          </p>
        </section>
        <DealerLoginForm />
      </div>
    </main>
  );
}
