export function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        rounded-[2rem]
        border border-white/10
        bg-[#111118]
        backdrop-blur-xl
        ${className}
      `}
    >
      {children}
    </div>
  );
}