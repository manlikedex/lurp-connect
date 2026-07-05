type StatusBadgeProps = {
  children: string;
  variant?: "default" | "success" | "warning" | "danger" | "purple";
};

export function StatusBadge({
  children,
  variant = "default",
}: StatusBadgeProps) {
  const styles = {
    default: "border-white/10 bg-white/[0.045] text-white/55",
    success: "border-emerald-300/20 bg-emerald-400/10 text-emerald-300",
    warning: "border-amber-300/20 bg-amber-400/10 text-amber-300",
    danger: "border-red-300/20 bg-red-400/10 text-red-300",
    purple: "border-purple-300/20 bg-purple-400/10 text-purple-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-black capitalize ${styles[variant]}`}
    >
      {children}
    </span>
  );
}