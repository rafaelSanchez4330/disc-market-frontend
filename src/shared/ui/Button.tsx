import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  children: ReactNode;
};

export function Button({ variant = "primary", className = "", children, ...props }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-40";
  const variants = {
    primary: "bg-accent text-ink hover:bg-accent-dark",
    ghost: "border border-line bg-transparent text-cream hover:border-accent hover:text-accent",
    danger: "bg-vinyl text-cream hover:brightness-110",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
