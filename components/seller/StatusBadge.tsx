import { badgeClass, type BadgeTone } from "@/components/seller/dashboardStyles";

const productToneByStatus: Record<string, BadgeTone> = {
  draft: "gray",
  pending_review: "amber",
  live: "green",
  rejected: "red",
  paused: "gray",
};

const shipmentToneByStatus: Record<string, BadgeTone> = {
  placed: "amber",
  packed: "amber",
  shipped: "green",
  out_for_delivery: "green",
  delivered: "green",
  cancelled: "red",
  returned: "red",
};

const payoutToneByStatus: Record<string, BadgeTone> = {
  pending: "amber",
  processing: "amber",
  paid: "green",
  failed: "red",
};

function StatusBadgeBase({ tone, label }: { tone: BadgeTone; label: string }) {
  return <span className={badgeClass(tone)}>{label.replace(/_/g, " ")}</span>;
}

export function ProductStatusBadge({ status }: { status: string }) {
  return <StatusBadgeBase label={status} tone={productToneByStatus[status] ?? "gray"} />;
}

export function ShipmentStatusBadge({ status }: { status: string }) {
  return <StatusBadgeBase label={status} tone={shipmentToneByStatus[status] ?? "gray"} />;
}

export function PayoutStatusBadge({ status }: { status: string }) {
  return <StatusBadgeBase label={status} tone={payoutToneByStatus[status] ?? "gray"} />;
}
