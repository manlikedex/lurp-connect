"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, UserRound, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { supabase } from "@/lib/supabase";

type Character = {
  id: string;
  name: string;
  age: string | null;
  occupation: string | null;
  faction: string | null;
  short_bio: string | null;
  backstory: string | null;
  image_url: string | null;
  created_at: string;
};

export default function CharacterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCharacter() {
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error(error);
      }

      setCharacter(data);
      setLoading(false);
    }

    loadCharacter();
  }, [id]);

  return (
    <AppShell>
      <Link
        href="/characters"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-white/50 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Characters
      </Link>

      {loading && (
        <section className="rounded-[2rem] border border-white/10 bg-[#111118] p-8">
          <p className="text-white/55">Loading character...</p>
        </section>
      )}

      {!loading && !character && (
        <section className="rounded-[2rem] border border-white/10 bg-[#111118] p-8">
          <h1 className="text-3xl font-black">Character not found</h1>
          <p className="mt-2 text-white/55">
            This character could not be found in Supabase.
          </p>
        </section>
      )}

      {character && (
        <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <aside className="rounded-[2.2rem] border border-white/10 bg-[#111118] p-5">
            <div className="aspect-square overflow-hidden rounded-[2rem] bg-purple-300/10 ring-1 ring-purple-300/15">
              {character.image_url ? (
                <img
                  src={character.image_url}
                  alt={character.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-purple-200">
                  <UserRound size={72} />
                </div>
              )}
            </div>
          </aside>

          <section className="rounded-[2.2rem] border border-white/10 bg-[#111118] p-6 sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-purple-200">
              Character Profile
            </p>

            <h1 className="mt-3 text-5xl font-black tracking-[-0.05em]">
              {character.name}
            </h1>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {character.age && <Info label="Age" value={character.age} />}
              {character.occupation && (
                <Info label="Occupation" value={character.occupation} />
              )}
              {character.faction && (
                <Info label="Faction" value={character.faction} />
              )}
            </div>

            {character.short_bio && (
              <div className="mt-8">
                <h2 className="text-xl font-black">Bio</h2>
                <p className="mt-3 leading-7 text-white/60">
                  {character.short_bio}
                </p>
              </div>
            )}

            {character.backstory && (
              <div className="mt-8">
                <h2 className="text-xl font-black">Backstory</h2>
                <p className="mt-3 whitespace-pre-wrap leading-7 text-white/60">
                  {character.backstory}
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {character.occupation && (
                <Badge icon={Shield} text={character.occupation} />
              )}
              {character.faction && (
                <Badge icon={Users} text={character.faction} />
              )}
            </div>
          </section>
        </section>
      )}
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 font-black">{value}</p>
    </div>
  );
}

function Badge({
  icon: Icon,
  text,
}: {
  icon: typeof Shield;
  text: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/70">
      <Icon size={15} />
      {text}
    </div>
  );
}