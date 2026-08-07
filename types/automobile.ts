export type Role = "platform_admin" | "dealer_user" | "ops_user" | "finance_partner_user";

export type FaqItem = {
  question: string;
  answer: string;
};

export type VehicleCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  categoryIds?: string[];
  active: boolean;
  featured: boolean;
  overview?: string;
  tagline?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type VehicleModel = {
  id: string;
  brandId: string;
  categoryId: string;
  name: string;
  slug: string;
  bodyType: string;
  loaderSize?: "Small" | "Medium" | "Large";
  noOfWheels?: number;
  tags?: string[];
  imageUrl: string;
  overview?: string;
  pros?: string[];
  cons?: string[];
  faq?: FaqItem[];
  active: boolean;
  featured: boolean;
  launchLabel?: string;
  isUpcoming?: boolean;
};

export type VehicleVariant = {
  id: string;
  modelId: string;
  name: string;
  slug: string;
  exShowroomPrice: number;
  fuelType: "Petrol" | "Diesel" | "CNG" | "Hybrid" | "Electric";
  transmission: "Manual" | "Automatic" | "AMT" | "CVT" | "DCT";
  engineCapacity: string;
  engineCc?: number;
  maxPowerPs?: number;
  payloadCapacityKg?: number;
  mileage: string;
  seatingCapacity: number;
  specifications: VehicleSpecifications;
  specificationGroups: SpecificationGroup[];
  isDefault?: boolean;
  displayOrder?: number;
  active: boolean;
};

export type SpecificationGroup = {
  title: string;
  description?: string;
  fields: { label: string; value?: string }[];
};

export type VehicleMedia = {
  id: string;
  modelId: string;
  variantId?: string;
  colorName?: string;
  url: string;
  alt: string;
  mediaType: "exterior" | "interior" | "color" | "feature";
  displayOrder: number;
  active: boolean;
};

export type HeroPromotion = {
  id: string;
  placement?: "homepage_hero" | "mini_home_banner";
  eyebrow?: string;
  headline?: string;
  supportingCopy?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  stat1Label?: string;
  stat1Value?: string;
  stat2Label?: string;
  stat2Value?: string;
  stat3Label?: string;
  stat3Value?: string;
  imageUrl: string;
  categoryKey: "cars" | "bikes" | "scooters" | "ev" | "commercial" | "ev-commercial" | "passenger-ev";
  brandId?: string;
  modelId?: string;
  variantId?: string;
  targetUrl: string;
  active: boolean;
};

export type ComparisonPage = {
  id: string;
  slug: string;
  title: string;
  cityId: string;
  vehicle1ModelId: string;
  vehicle1VariantId: string;
  vehicle2ModelId: string;
  vehicle2VariantId: string;
  vehicle3ModelId?: string;
  vehicle3VariantId?: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  verdict: string;
  faq: FaqItem[];
  showOnHomepage: boolean;
  showInFooter: boolean;
  displayOrder: number;
  active: boolean;
};

export type VehicleSpecificationSection = Record<string, string | undefined>;

export type VehicleSpecifications = {
  engine: VehicleSpecificationSection;
  dimensions: VehicleSpecificationSection;
  interior: VehicleSpecificationSection;
  exterior: VehicleSpecificationSection;
  safety: VehicleSpecificationSection;
  ev?: VehicleSpecificationSection;
  commercial?: VehicleSpecificationSection;
  bike?: VehicleSpecificationSection;
  colors: string[];
  colorHexMap?: Record<string, string>;
  features: string[];
  highlights: string[];
  [key: string]: unknown;
};

export type State = {
  id: string;
  name: string;
  code: string;
};

export type City = {
  id: string;
  stateId: string;
  name: string;
  slug: string;
  defaultRtoId: string;
  tier?: string;
  isMetro?: boolean;
  rtoStateCode?: string;
};

export type CityPage = {
  id: string;
  cityId: string;
  slug: string;
  title: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  body: string;
  heroImageUrl?: string;
  featuredCategoryId?: string;
  featuredBrandIds: string[];
  faq: FaqItem[];
  showInFooter: boolean;
  displayOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PricingVehicleClass =
  | "car"
  | "bike"
  | "scooter"
  | "ev_two_wheeler"
  | "commercial_loading"
  | "commercial_passenger"
  | "ev_commercial_loading"
  | "ev_commercial_passenger"
  | "passenger_ev"
  | "loading_ev";

export type RtoOffice = {
  id: string;
  stateId: string;
  cityId: string;
  code: string;
  name: string;
};

export type StateTaxRule = {
  id: string;
  stateId: string;
  categoryId: string;
  fuelType?: VehicleVariant["fuelType"];
  minPrice: number;
  maxPrice?: number;
  roadTaxPercent: number;
  fixedTaxAmount: number;
  evExemptionPercent: number;
  luxuryCessPercent: number;
  active: boolean;
};

export type RtoCharge = {
  id: string;
  stateId: string;
  cityId: string;
  rtoId: string;
  registrationFee: number;
  smartCardFee: number;
  numberPlateFee: number;
  hypothecationFee: number;
  fastagFee: number;
  handlingCharges: number;
  active: boolean;
};

export type InsuranceRule = {
  id: string;
  categoryId: string;
  fuelType?: VehicleVariant["fuelType"];
  percentOfExShowroom: number;
  fixedAmount: number;
  active: boolean;
};

export type GstRule = {
  id: string;
  vehicleClass: PricingVehicleClass;
  gstPercent: number;
  active: boolean;
};

export type RegistrationFeeRule = {
  id: string;
  vehicleClass: PricingVehicleClass;
  registrationFee: number;
  smartCardFee: number;
  numberPlateFee: number;
  hypothecationFee: number;
  fastagFee: number;
  handlingCharges: number;
  active: boolean;
};

export type Dealer = {
  id: string;
  dealerBusinessId?: string;
  name: string;
  slug: string;
  logoUrl?: string;
  cityId: string;
  area: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstNumber?: string;
  active: boolean;
  verified: boolean;
  priority: number;
};

export type DealerVerificationStatus = "pending" | "verified" | "rejected";

export type DealerBusiness = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  active: boolean;
  verified: boolean;
  verificationStatus: DealerVerificationStatus;
  rejectionReason?: string;
  createdAt?: string;
};

export type DealerUserRole = "dealer_business_admin" | "dealer_showroom_user";

export type DealerUser = {
  id: string;
  userId: string;
  dealerBusinessId: string;
  dealerId?: string;
  role: DealerUserRole;
  active: boolean;
  createdAt?: string;
};

export type DealerBrandMapping = {
  id: string;
  dealerId: string;
  brandId: string;
  cityId: string;
  active: boolean;
};

export type Offer = {
  id: string;
  title: string;
  description?: string;
  dealerBusinessId?: string;
  dealerId?: string;
  brandId?: string;
  modelId?: string;
  cityId?: string;
  discountAmount: number;
  sponsorType: "platform" | "dealer" | "brand" | "finance_partner" | "insurance_partner";
  placement: "pricing_page" | "dealer_card" | "homepage" | "seo_page";
  approvalStatus?: "pending" | "approved" | "rejected";
  createdByDealerUserId?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  createdAt?: string;
};

export type LeadStatus =
  | "new"
  | "assigned"
  | "contacted"
  | "interested"
  | "test_drive_scheduled"
  | "booked"
  | "lost"
  | "invalid";

export type VehicleLead = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cityId: string;
  brandId: string;
  modelId: string;
  variantId: string;
  selectedOnRoadPrice: number;
  preferredContactTime?: string;
  message?: string;
  assignedDealerBusinessId?: string;
  assignedDealerId?: string;
  assignedDealerUserId?: string;
  status: LeadStatus;
  source: "pricing_page" | "seo_page" | "homepage" | "admin";
  createdAt: string;
};

export type SeoPage = {
  id: string;
  slug: string;
  pageKind: "city_price" | "model_price" | "category" | "ev" | "comparison" | "guide";
  title: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  body: string;
  faq: FaqItem[];
  filters: {
    cityId?: string;
    stateId?: string;
    categoryId?: string;
    brandId?: string;
    modelId?: string;
    variantId?: string;
    fuelType?: string;
    priceMin?: number;
    priceMax?: number;
  };
  showOnHomepage: boolean;
  showInFooter: boolean;
  active: boolean;
};

export type PriceBreakdown = {
  exShowroomPrice: number;
  gstPercent?: number;
  gstAmount?: number;
  roadTax: number;
  registrationFee: number;
  insurance: number;
  smartCardFee: number;
  numberPlateFee: number;
  hypothecationFee: number;
  fastagFee: number;
  handlingCharges: number;
  offerDiscount: number;
  totalOnRoadPrice: number;
};

export type PricingResult = {
  brand: Brand;
  model: VehicleModel;
  variant: VehicleVariant;
  city: City;
  state: State;
  rto?: RtoOffice;
  dealer?: Dealer;
  offer?: Offer;
  dealerOffers: Offer[];
  breakdown: PriceBreakdown;
};

export type VehicleStoryLaunchStatus = "upcoming" | "launched" | "updated" | "discontinued";
export type VehicleStoryType = "vehicle_story" | "brand_update";

export type VehicleStory = {
  id: string;
  slug: string;
  brandSlug: string;
  brandName: string;
  modelId?: string;
  storyType: VehicleStoryType;
  title: string;
  tagline?: string;
  heroImageUrl?: string;
  intro: string;
  body: string;
  launchStatus: VehicleStoryLaunchStatus;
  expectedLaunchDate?: string;
  actualLaunchDate?: string;
  seoTitle?: string;
  seoDescription?: string;
  featured: boolean;
  publishedAt?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type VehicleStoryUpdate = {
  id: string;
  storyId: string;
  title: string;
  body: string;
  imageUrl?: string;
  postedAt: string;
  active: boolean;
  createdAt: string;
};

export type VehicleStoryMedia = {
  id: string;
  storyId: string;
  url: string;
  alt: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
};

// --- GaadiGear ---

export type VehicleType = {
  id: string;
  name: string;
  slug: string;
};

export type GearCategory = {
  id: string;
  parentId?: string;
  name: string;
  slug: string;
  level: number;
  applicableVehicleTypes: string[];
  sortOrder: number;
  isActive: boolean;
  imageUrl?: string;
  commissionPct: number;
};

export type GearCollectionType = "manual" | "dynamic" | "brand" | "category" | "vehicle";
export type GearCollectionDisplayStyle = "carousel" | "grid" | "banner" | "hero" | "featured";

export type GearCollection = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: GearCollectionType;
  bannerImage?: string;
  icon?: string;
  priority: number;
  isActive: boolean;
  maxProducts: number;
  conditions: Record<string, unknown>;
  startAt?: string;
  endAt?: string;
  productIds: string[]; // manual/brand/category: admin-chosen, ordered
};

export type GearCollectionProductCard = {
  productId: string;
  title: string;
  slug: string;
  price: number;
  mrp: number;
  startingFrom: boolean;
  variantCount: number;
  ratingAvg: number;
  thumbnailUrl?: string;
  fitsSummary: string;
};

export type GearHomepageSection = {
  id: string;
  title: string;
  subtitle?: string;
  collectionId?: string;
  displayStyle: GearCollectionDisplayStyle;
  sortOrder: number;
  isActive: boolean;
};

export type GearHeroBanner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  ctaLabel: string;
  ctaHref: string;
  isActive: boolean;
  sortOrder: number;
};

export type SellerStatus = "onboarding" | "active" | "suspended";
export type SellerKycStatus = "pending_review" | "verified" | "rejected";

export type Seller = {
  id: string;
  businessName: string;
  brandName?: string;
  businessType?: string;
  gstin?: string;
  pan?: string;
  kycStatus: SellerKycStatus;
  kycRejectionReason?: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  bannerUrl?: string;
  about?: string;
  status: SellerStatus;
  commissionPct: number;
  createdAt: string;
  interestedCategoryIds?: string[];
  emailVerifiedAt?: string;
};

export type SellerUserRole = "seller_owner" | "seller_staff";

export type SellerUser = {
  id: string;
  userId: string;
  sellerId: string;
  role: SellerUserRole;
  active: boolean;
  createdAt?: string;
};

export type GearBrand = {
  id: string;
  sellerId?: string;
  name: string;
  slug: string;
  logoUrl?: string;
  isOem: boolean;
  active: boolean;
};

export type GearProductVariant = {
  id: string;
  productId: string;
  size?: string;
  color?: string;
  mrp: number;
  sellingPrice: number;
  stockQty: number;
  skuSuffix?: string;
  images: string[];
};

export type SellerShippingSettingsRecord = {
  sellerId: string;
  shipsPanIndia: boolean;
  excludedStates: string[];
  excludedPincodes: string[];
  feeType: "flat" | "free" | "threshold";
  flatFee: number;
  freeShippingAbove?: number;
  standardDeliveryDays: number;
  codAvailable: boolean;
};

export type SellerKycDocument = {
  id: string;
  sellerId: string;
  docType: string;
  fileUrl: string;
  uploadedAt: string;
};

export type SellerBankDetails = {
  sellerId: string;
  accountHolder?: string;
  ifsc?: string;
  upiId?: string;
  payoutCycle: string;
};

export type GearProductStatus = "draft" | "pending_review" | "live" | "rejected" | "paused";

export type GearCompatibilityType = "global" | "vehicle_type" | "segment" | "brand" | "model" | "variant";

export type GearProductCompatibilityRow = {
  id?: string;
  compatibilityType: GearCompatibilityType;
  vehicleTypeId?: string;
  segment?: string;
  vehicleBrandId?: string;
  vehicleModelId?: string;
  vehicleVariantId?: string;
};

export type GearProduct = {
  id: string;
  sellerId: string;
  sellerName?: string;
  brandId?: string;
  brandName?: string;
  categoryId: string;
  categoryName?: string;
  title: string;
  slug: string;
  description?: string;
  // Derived from variants (there is no product-level price anymore): mrp/
  // sellingPrice are the cheapest variant's, stockQty is the sum across all
  // variants -- every product has >= 1 variant, price lives there exclusively.
  mrp: number;
  sellingPrice: number;
  hasMultipleVariants: boolean; // true => callers should show "Starting from"
  gstRate: number;
  hsnCode?: string;
  stockQty: number;
  sku?: string;
  images: string[];
  attributes: Record<string, unknown>;
  usageTags: string[];
  status: GearProductStatus;
  rejectionReason?: string;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  compatibility?: GearProductCompatibilityRow[];
};

export type GearCartItem = {
  id: string;
  productId: string;
  variantId?: string;
  categoryId?: string;
  qty: number;
  title: string;
  slug: string;
  sellerId: string;
  sellerName?: string;
  unitPrice: number;
  gstRate: number;
  thumbnailUrl?: string;
  variantLabel?: string;
  lineTotal: number;
};

export type GearCartSellerGroup = {
  sellerId: string;
  sellerName?: string;
  items: GearCartItem[];
  itemsSubtotal: number;
  shippingFee: number;
  deliverable: boolean;
  serviceabilityNote?: string;
};

export type GearCart = {
  id: string;
  buyerId?: string;
  items: GearCartItem[];
  itemsSubtotal: number;
};

export type GearOrderShipmentSummary = {
  id: string;
  sellerId: string;
  sellerName?: string;
  itemsSubtotal: number;
  shippingFee: number;
  gstAmount: number;
  shipmentStatus: string;
  items: GearCartItem[];
};

export type GearOrderSummary = {
  id: string;
  buyerId?: string;
  status: string;
  paymentStatus: string;
  itemsSubtotal: number;
  shippingTotal: number;
  grandTotal: number;
  createdAt: string;
  shipments: GearOrderShipmentSummary[];
};

export type AnalyticsPageview = {
  id: string;
  visitorId: string;
  sessionId: string;
  path: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  createdAt: string;
};

export type AnalyticsSession = {
  sessionId: string;
  visitorId: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  landingPath: string;
  pageCount: number;
  startedAt: string;
  lastSeenAt: string;
};

export type AnalyticsCampaignSummary = {
  utmSource: string;
  utmCampaign: string;
  sessionCount: number;
  pageviewCount: number;
  topLandingPath: string;
};
