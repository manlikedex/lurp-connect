import { Camera } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

const items = [
  "Street Scene",
  "Car Meet",
  "City Lights",
  "Underworld",
  "Police Chase",
  "Business Opening",
  "Crew Photo",
  "Night Life",
];

export default function GalleryPage() {
  return (
    <AppShell>
      <section className="rounded-[2.2rem] border border-white/10 bg-[#111118] p-6 sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-purple-200">
          Media Gallery
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
          Featured community moments.
        </h1>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item, index) => (
          <article
            key={item}
            className="group relative h-56 overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#111118]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(168,85,247,0.25),transparent_45%)] transition duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

            <div className="absolute bottom-5 left-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <Camera size={18} />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                0{index + 1}
              </p>
              <h2 className="text-lg font-black">{item}</h2>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}