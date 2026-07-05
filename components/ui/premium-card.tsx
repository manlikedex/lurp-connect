import { ReactNode } from "react";

type PremiumCardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export function PremiumCard({
  children,
  className = "",
  hover = false,
}: PremiumCardProps) {
  return (
    <section
      className={`premium-panel rounded-[1.7rem] p-5 ${
        hover ? "premium-card-hover" : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}