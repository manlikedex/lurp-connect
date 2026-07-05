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
    <section className="premium-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_8%,rgba(168,85,247,0.18),transparent_34%)]" />
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-fuchsia-400/10 blur-3xl" />

      <div className="relative">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/55">
          {Icon && <Icon size={14} className="text-purple-200" />}
          {badge}
        </div>

        <h1 className="max-w-5xl text-balance text-4xl font-black tracking-[-0.055em] text-white sm:text-5xl xl:text-6xl">
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