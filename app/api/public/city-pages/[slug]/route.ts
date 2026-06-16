import { getCityPageView } from "@/lib/services/city-pages";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const view = await getCityPageView(slug);
  if (!view) return Response.json({ error: "City page not found" }, { status: 404 });
  return Response.json(view);
}
