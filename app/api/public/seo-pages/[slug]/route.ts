import { getSeoPageResults } from "@/lib/services/seo";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = getSeoPageResults(slug);

  if (!result) {
    return Response.json({ error: "SEO page not found" }, { status: 404 });
  }

  return Response.json(result);
}
