"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Shield, UserRound, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
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

export default function CharactersPage() {
const [characters, setCharacters] = useState<Character[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
async function loadCharacters() {
const { data, error } = await supabase
.from("characters")
.select("*")
.eq("visibility", "public")
.eq("status", "approved")
.order("created_at", { ascending: false });


  if (error) {
    console.error(error);
  }

  setCharacters(data || []);
  setLoading(false);
}

loadCharacters();


}, []);

const hasCharacters = characters.length > 0;

return ( <AppShell> <PageHeader
     badge="Character Showcase"
     title="Community Characters"
     description="Explore player-created characters from across the LURP community."
     icon={Users}
   />

  <div className="mt-5 flex justify-end">
    <Link
      href="/characters/create"
      className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118] transition hover:scale-[1.02]"
    >
      <Plus size={17} />
      Create Character
    </Link>
  </div>

  {loading && (
    <section className="mt-5 rounded-[2.2rem] border border-white/10 bg-[#111118] p-8">
      <p className="text-white/55">Loading characters...</p>
    </section>
  )}

  {!loading && !hasCharacters && (
    <section className="mt-5 flex min-h-[420px] flex-col items-center justify-center rounded-[2.2rem] border border-white/10 bg-[#111118] p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
        <UserRound size={38} />
      </div>

      <h2 className="mt-6 text-3xl font-black">
        No one has uploaded their character yet.
      </h2>

      <p className="mt-3 max-w-md text-sm leading-6 text-white/55">
        Want to be the first? Create your character profile and showcase it
        to the LURP community.
      </p>

      <Link
        href="/characters/create"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[#111118] transition hover:scale-[1.02]"
      >
        <Plus size={17} />
        Create Character
      </Link>
    </section>
  )}

  {!loading && hasCharacters && (
    <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {characters.map((character) => (
        <Link
          key={character.id}
          href={`/characters/${character.id}`}
          className="rounded-[2rem] border border-white/10 bg-[#111118] p-5 transition hover:-translate-y-1 hover:bg-white/[0.04]"
        >
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[2rem] bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
            {character.image_url ? (
              <img
                src={character.image_url}
                alt={character.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound size={42} />
            )}
          </div>

          <h2 className="mt-5 text-2xl font-black">
            {character.name}
          </h2>

          <div className="mt-3 space-y-2 text-sm text-white/50">
            {character.occupation && (
              <p className="flex items-center gap-2">
                <Shield size={15} />
                {character.occupation}
              </p>
            )}

            {character.faction && (
              <p className="flex items-center gap-2">
                <Users size={15} />
                {character.faction}
              </p>
            )}
          </div>

          {character.short_bio && (
            <p className="mt-4 text-sm leading-6 text-white/55">
              {character.short_bio}
            </p>
          )}
        </Link>
      ))}
    </section>
  )}
</AppShell>
  );
}
