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

export type DealerBusiness = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  active: boolean;
  verified: boolean;
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

export type VehicleStory = {
  id: string;
  slug: string;
  brandSlug: string;
  brandName: string;
  modelId?: string;
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
