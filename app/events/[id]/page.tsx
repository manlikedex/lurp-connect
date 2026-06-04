"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { supabase } from "@/lib/supabase";

type Event = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  image_url: string | null;
  starts_at: string | null;
  max_attendees: number | null;
  status: string | null;
};

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvping, setRsvping] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) console.error(error);

      setEvent(data);
      setLoading(false);
    }

    loadEvent();
  }, [id]);

  async function rsvp() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !event) {
      alert("Login with Discord to RSVP.");
      return;
    }

    setRsvping(true);

    const { error } = await supabase.from("event_rsvps").insert({
      event_id: event.id,
      profile_id: user.id,
      status: "going",
    });

    if (error) {
      alert(error.message);
      console.error(error);
    } else {
      alert("RSVP confirmed!");
    }

    setRsvping(false);
  }

  return (
    <AppShell>
      <Link
        href="/events"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-white/50 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Events
      </Link>

      {loading && (
        <section className="rounded-[2rem] border border-white/10 bg-[#111118] p-8">
          <p className="text-white/55">Loading event...</p>
        </section>
      )}

      {!loading && !event && (
        <section className="rounded-[2rem] border border-white/10 bg-[#111118] p-8">
          <h1 className="text-3xl font-black">Event not found</h1>
        </section>
      )}

      {event && (
        <section className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#111118]">
          <div className="h-72 bg-[radial-gradient(circle_at_50%_20%,rgba(168,85,247,0.22),transparent_45%)]">
            {event.image_url && (
              <img
                src={event.image_url}
                alt={event.title}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="p-6 sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-purple-200">
              {event.status || "upcoming"}
            </p>

            <h1 className="mt-3 text-5xl font-black tracking-[-0.05em]">
              {event.title}
            </h1>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {event.starts_at && (
                <Info
                  icon={Clock}
                  label="Starts"
                  value={new Date(event.starts_at).toLocaleString()}
                />
              )}

              {event.location && (
                <Info icon={MapPin} label="Location" value={event.location} />
              )}

              {event.max_attendees && (
                <Info
                  icon={Users}
                  label="Max Attendees"
                  value={String(event.max_attendees)}
                />
              )}
            </div>

            {event.description && (
              <p className="mt-8 whitespace-pre-wrap leading-7 text-white/60">
                {event.description}
              </p>
            )}

            <button
              onClick={rsvp}
              disabled={rsvping}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[#111118] disabled:opacity-60"
            >
              <CalendarDays size={17} />
              {rsvping ? "Confirming..." : "RSVP Now"}
            </button>
          </div>
        </section>
      )}
    </AppShell>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4">
      <Icon size={18} className="text-purple-200" />
      <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 font-black">{value}</p>
    </div>
  );
}