import { notFound } from "next/navigation";
import { SellerProductEditor } from "@/components/seller/SellerProductEditor";
import { getGearCategories, getVehicleTypes } from "@/lib/services/gear-admin";
import { getSellerAccessContext } from "@/lib/services/seller-auth";
import { getProductForSeller, getVariantsForProduct } from "@/lib/services/seller-catalog";
import { getSlimCatalog } from "@/lib/repositories/vehicle-data";

export default async function EditSellerProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const context = await getSellerAccessContext();
  if (!context) return null;

  const product = await getProductForSeller(context.seller.id, productId);
  if (!product) notFound();

  const [categories, vehicleTypes, catalog, variants] = await Promise.all([
    getGearCategories(),
    getVehicleTypes(),
    getSlimCatalog(),
    getVariantsForProduct(context.seller.id, productId),
  ]);
  const l2Categories = categories.filter((c) => c.level === 2);

  return (
    <SellerProductEditor
      brands={catalog.brands}
      categories={l2Categories}
      initialVariantCount={variants.length}
      models={catalog.models}
      product={product}
      variants={catalog.variants}
      vehicleTypes={vehicleTypes}
    />
  );
}
