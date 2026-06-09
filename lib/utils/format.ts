export function formatIndianPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatShortPrice(value: number) {
  if (value >= 10000000) {
    const crore = value / 10000000;
    return `INR ${Number.isInteger(crore) ? crore : crore.toFixed(2)} Cr`;
  }

  if (value >= 100000) {
    const lakh = value / 100000;
    return `INR ${Number.isInteger(lakh) ? lakh : lakh.toFixed(2)} L`;
  }

  return formatIndianPrice(value);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
