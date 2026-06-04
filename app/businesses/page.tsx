"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Plus, Store, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/lib/supabase";

type Business = {
  id: string;
  owner_id: string | null;
  name: string;
  category: string | null;
  description: string | null;
  location: string | null;
  logo_url: string | null;
  banner_url: string | null;
  website: string | null;
  discord: string | null;
  status: string | null;
  profiles:
    | {
        username: string;
        display_name: string | null;
        avatar_url: string | null;
      }
    | null;
};

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBusinesses() {
      const { data, error } = await supabase
        .from("businesses")
        .select(
          `
          id,
          owner_id,
          name,
          category,
          description,
          location,
          logo_url,
          banner_url,
          website,
          discord,
          status,
          profiles:owner_id (
            username,
            display_name,
            avatar_url
          )
        `
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Business load error:", error);
      }

      setBusinesses((data as Business[]) || []);
      setLoading(false);
    }

    loadBusinesses();
  }, []);

  return (
    <AppShell>
      <PageHeader
        badge="Business Directory"
        title="Player-run businesses across London."
        description="Discover active businesses, owners, locations and services inside the LURP community."
        icon={Store}
      />

      <div className="mt-5 flex justify-end">
        <Link
          href="/businesses/create"
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118] transition hover:scale-[1.02]"
        >
          <Plus size={17} />
          Create Business
        </Link>
      </div>

      {loading && (
        <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#111118] p-8">
          <p className="text-white/55">Loading businesses...</p>
        </section>
      )}

      {!loading && businesses.length === 0 && (
        <section className="mt-5 flex min-h-[360px] flex-col items-center justify-center rounded-[2.2rem] border border-white/10 bg-[#111118] p-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
            <Store size={38} />
          </div>

          <h2 className="mt-6 text-3xl font-black">
            No businesses have been created yet.
          </h2>

          <p className="mt-3 max-w-md text-sm leading-6 text-white/55">
            Want to be the first? Create your business profile and showcase it
            to the LURP community.
          </p>

          <Link
            href="/businesses/create"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[#111118] transition hover:scale-[1.02]"
          >
            <Plus size={17} />
            Create Business
          </Link>
        </section>
      )}

      {!loading && businesses.length > 0 && (
        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          {businesses.map((business) => (
            <Link
              key={business.id}
              href={`/businesses/${business.id}`}
              className="group overflow-hidden rounded-[2rem] border border-white/10 bg-[#111118] transition hover:-translate-y-1 hover:bg-white/[0.04]"
            >
              <div className="relative h-44 border-b border-white/10 bg-[radial-gradient(circle_at_50%_20%,rgba(168,85,247,0.22),transparent_45%)]">
                {business.banner_url && (
                  <img
                    src={business.banner_url}
                    alt={business.name}
                    className="h-full w-full object-cover"
                  />
                )}

                <div className="absolute -bottom-10 left-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#111118] text-purple-200 shadow-xl">
                  {business.logo_url ? (
                    <img
                      src={business.logo_url}
                      alt={business.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Store size={34} />
                  )}
                </div>
              </div>

              <div className="p-5 pt-14">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-200/80">
                  {business.category || "Business"}
                </p>

                <h2 className="mt-2 text-2xl font-black">{business.name}</h2>

                {business.description && (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/55">
                    {business.description}
                  </p>
                )}

                <div className="mt-5 grid gap-3 text-sm text-white/50">
                  <div className="flex items-center gap-2">
                    <UserRound size={16} />
                    Owned by{" "}
                    {business.profiles?.display_name ||
                      business.profiles?.username ||
                      "LURP Member"}
                  </div>

                  {business.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      {business.location}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </AppShell>
  );
}