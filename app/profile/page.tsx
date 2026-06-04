"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Briefcase,
  CalendarDays,
  Camera,
  Crown,
  Gift,
  MessageCircle,
  User,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  xp: number;
  created_at: string;
};

type Counts = {
  characters: number;
  businesses: number;
  posts: number;
  media: number;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [counts, setCounts] = useState<Counts>({
    characters: 0,
    businesses: 0,
    posts: 0,
    media: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const metadata = user.user_metadata;

      const username =
        metadata?.preferred_username ||
        metadata?.full_name ||
        metadata?.name ||
        "LURP Member";

      const avatarUrl = metadata?.avatar_url || null;
      const discordId = metadata?.provider_id || null;

      await supabase.from("profiles").upsert({
        id: user.id,
        username,
        display_name: username,
        avatar_url: avatarUrl,
        discord_id: discordId,
      });

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const [charactersResult, businessesResult, postsResult, mediaResult] =
        await Promise.all([
          supabase
            .from("characters")
            .select("id", { count: "exact", head: true })
            .eq("owner_id", user.id),

          supabase
            .from("businesses")
            .select("id", { count: "exact", head: true })
            .eq("owner_id", user.id),

          supabase
            .from("posts")
            .select("id", { count: "exact", head: true })
            .eq("author_id", user.id),

          supabase
            .from("media")
            .select("id", { count: "exact", head: true })
            .eq("uploaded_by", user.id),
        ]);

      setProfile(profileData);
      setCounts({
        characters: charactersResult.count || 0,
        businesses: businessesResult.count || 0,
        posts: postsResult.count || 0,
        media: mediaResult.count || 0,
      });

      setLoading(false);
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <section className="rounded-[2rem] border border-white/10 bg-[#111118] p-6">
          <p className="text-white/55">Loading your profile...</p>
        </section>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <section className="rounded-[2rem] border border-white/10 bg-[#111118] p-6">
          <h1 className="text-3xl font-black">Not signed in</h1>
          <p className="mt-2 text-white/55">
            Login with Discord to view your LURP Connect profile.
          </p>
        </section>
      </AppShell>
    );
  }

  const nextLevelXp = profile.level * 1000;
  const progress = Math.min(Math.round((profile.xp / nextLevelXp) * 100), 100);

  return (
    <AppShell>
      <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <aside className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#111118]">
          <div className="relative h-36 bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.32),transparent_38%),radial-gradient(circle_at_80%_25%,rgba(217,70,239,0.18),transparent_40%)]">
            <div className="absolute inset-0 bg-gradient-to-t from-[#111118] to-transparent" />
          </div>

          <div className="px-6 pb-6">
            <div className="-mt-14 flex flex-col items-center text-center">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-[#111118] text-purple-200 ring-4 ring-[#111118]">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={48} />
                )}
              </div>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-1.5 text-xs font-black text-purple-200">
                <BadgeCheck size={14} />
                LURP Member
              </div>

              <h1 className="mt-3 max-w-full truncate text-3xl font-black tracking-[-0.04em]">
                {profile.display_name || profile.username}
              </h1>

              <p className="mt-1 max-w-full truncate text-sm text-white/45">
                @{profile.username}
              </p>

              <button className="mt-5 w-full rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118] transition hover:scale-[1.02]">
                Edit Profile
              </button>
            </div>
          </div>
        </aside>

        <section className="grid gap-5">
          <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
                  <Crown size={25} />
                </div>

                <div>
                  <p className="text-sm font-bold text-white/40">
                    Community Progress
                  </p>
                  <h2 className="text-3xl font-black">Level {profile.level}</h2>
                </div>
              </div>

              <div className="w-full lg:max-w-md">
                <div className="mb-2 flex justify-between text-sm text-white/45">
                  <span>{profile.xp} XP</span>
                  <span>{nextLevelXp} XP</span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-purple-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card icon={Users} title="Characters" value={counts.characters} />
            <Card
              icon={Briefcase}
              title="Businesses"
              value={counts.businesses}
            />
            <Card icon={MessageCircle} title="Posts" value={counts.posts} />
            <Card icon={Camera} title="Media" value={counts.media} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card icon={CalendarDays} title="Events" value={0} />
            <Card icon={Gift} title="Rewards" value={0} />
            <Card icon={BadgeCheck} title="Badges" value="Member" />
            <Card icon={Crown} title="Rank" value="Newcomer" />
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-6">
            <p className="text-sm font-bold text-white/40">Joined LURP Connect</p>
            <h2 className="mt-2 text-2xl font-black">
              {new Date(profile.created_at).toLocaleDateString()}
            </h2>
          </div>
        </section>
      </section>
    </AppShell>
  );
}

function Card({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof Crown;
  title: string;
  value: string | number;
}) {
  return (
    <article className="rounded-[1.7rem] border border-white/10 bg-[#111118] p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.04] text-purple-200 ring-1 ring-white/10">
        <Icon size={20} />
      </div>

      <p className="text-sm font-bold text-white/40">{title}</p>
      <h2 className="mt-2 text-3xl font-black">{value}</h2>
    </article>
  );
}