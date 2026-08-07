import { GearSellersList } from "@/components/admin/gaadigear/GearSellersList";
import { getSellers } from "@/lib/services/gear-admin";
import { getSellerKycDocumentsForSellers } from "@/lib/services/seller-auth";

export default async function AdminGearSellersPage() {
  const sellers = await getSellers();
  const kycDocumentsBySeller = await getSellerKycDocumentsForSellers(sellers.map((s) => s.id));
  return <GearSellersList sellers={sellers} kycDocumentsBySeller={kycDocumentsBySeller} />;
}
