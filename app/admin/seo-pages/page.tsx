import { seoPages } from "@/lib/data";

export default function AdminSeoPagesPage() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase text-emerald-700">Structured SEO</p>
      <h1 className="mt-1 text-2xl font-black text-slate-950">SEO pages</h1>
      <p className="mt-2 text-sm text-slate-600">Next slice: structured SEO builder with saved filters and live pricing/model data.</p>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {seoPages.map((page) => (
          <a className="rounded-lg border border-slate-200 p-3 transition hover:border-emerald-200 hover:bg-emerald-50" href={`/seo/${page.slug}`} key={page.id}>
            <div className="font-black text-slate-950">{page.title}</div>
            <div className="mt-1 text-xs font-bold text-slate-500">/{page.slug}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
