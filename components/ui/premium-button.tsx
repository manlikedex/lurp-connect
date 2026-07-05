import Link from "next/link";
import { ReactNode } from "react";

type PremiumButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
};

export function PremiumButton({
  children,
  href,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
  type = "button",
}: PremiumButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50";

  const styles = {
    primary: "bg-white text-[#111118] hover:scale-[1.02]",
    secondary:
      "border border-white/10 bg-white/[0.045] text-white/75 hover:bg-white/[0.08]",
    danger:
      "border border-red-300/20 bg-red-400/10 text-red-300 hover:bg-red-400/15",
  };

  const classes = `${base} ${styles[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}