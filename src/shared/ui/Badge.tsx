import { availabilityLabel } from "../../data/products";
import type { Availability } from "../../data/types";

const styles: Record<Availability, string> = {
  AVAILABLE: "bg-ok/15 text-ok",
  LOW_STOCK: "bg-accent/15 text-accent",
  MADE_TO_ORDER: "bg-cream/10 text-cream",
  OUT_OF_STOCK: "bg-muted/10 text-muted",
};

export function Badge({ status }: { status: Availability }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${styles[status]}`}>
      {availabilityLabel[status]}
    </span>
  );
}
