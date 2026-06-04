import { LucideIcon } from "lucide-react";

type PageHeaderProps = {
  badge: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
};

export function PageHeader({
  badge,
  title,
  description,
  icon: Icon,
}: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#111118] p-6 shadow-2xl shadow-black/20 sm:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(168,85,247,0.16),transparent_34%)]" />

      <div className="relative">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/55">
          {Icon && <Icon size={14} className="text-purple-200" />}
          {badge}
        </div>

        <h1 className="max-w-4xl text-balance text-4xl font-black tracking-[-0.05em] sm:text-5xl xl:text-6xl">
          {title}
        </h1>

        {description && (
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}