// Shared between the server-side PLP filter query and the client-side
// sidebar checkboxes, so both agree on exactly what "bucket 2" means.
export const GEAR_PRICE_BUCKETS = [
  { label: "Under ₹500", min: 0, max: 499 },
  { label: "₹500 – ₹999", min: 500, max: 999 },
  { label: "₹1,000 – ₹1,999", min: 1000, max: 1999 },
  { label: "₹2,000 – ₹4,999", min: 2000, max: 4999 },
  { label: "₹5,000 & above", min: 5000, max: undefined },
] as const;
