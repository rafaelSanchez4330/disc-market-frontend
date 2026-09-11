import { formatPrice } from "../../data/products";

export function Price({ value, className = "" }: { value: number; className?: string }) {
  return <span className={`font-display font-bold text-accent ${className}`}>{formatPrice(value)}</span>;
}
