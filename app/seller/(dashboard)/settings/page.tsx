import { SellerSettingsForm } from "@/components/seller/SellerSettingsForm";
import { getSellerAccessContext, getSellerBankDetails, getSellerKycDocuments, getSellerShippingSettings } from "@/lib/services/seller-auth";

export default async function SellerSettingsPage() {
  const context = await getSellerAccessContext();
  if (!context) return null;

  const [bankDetails, shippingSettings, kycDocuments] = await Promise.all([
    getSellerBankDetails(context.seller.id),
    getSellerShippingSettings(context.seller.id),
    getSellerKycDocuments(context.seller.id),
  ]);

  return <SellerSettingsForm bankDetails={bankDetails} kycDocuments={kycDocuments} seller={context.seller} shippingSettings={shippingSettings} />;
}
