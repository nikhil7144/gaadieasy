import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getRecommendedGearForModel } from "@/lib/services/gear-public";

export async function RecommendedGearWidget({ modelId, modelName }: { modelId: string; modelName: string }) {
  const products = await getRecommendedGearForModel(modelId);
  if (products.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-slate-950">Recommended gear for {modelName}</h2>
        <Link className="flex shrink-0 items-center gap-1 text-sm font-bold text-emerald-700 hover:underline" href={`/gaadigear/products?model_id=${modelId}`}>
          View all <ArrowRight size={14} />
        </Link>
      </div>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {products.slice(0, 6).map((p) => {
          const discountPct = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
          return (
            <Link
              className="w-36 shrink-0 rounded-lg border border-slate-200 p-2 transition hover:border-emerald-300 hover:shadow-sm"
              href={`/gaadigear/products/${p.slug}`}
              key={p.productId}
            >
              <div className="grid h-24 w-full place-items-center overflow-hidden rounded-md bg-slate-50">
                {p.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={p.title} className="h-full w-full object-cover" src={p.thumbnailUrl} />
                ) : (
                  <span className="text-xs text-slate-400">No image</span>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-xs font-bold text-slate-950">{p.title}</p>
              {p.variantCount > 1 && <p className="mt-0.5 text-[10px] font-bold text-slate-400">Starting from</p>}
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-sm font-black text-emerald-700">₹{p.price}</span>
                {discountPct > 0 && <span className="text-[10px] text-slate-400 line-through">₹{p.mrp}</span>}
              </div>
              {discountPct > 0 && <p className="text-[10px] font-bold text-amber-600">{discountPct}% off</p>}
              {p.variantCount > 1 && (
                <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {p.variantCount} variants
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
