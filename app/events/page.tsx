"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock, MapPin, Plus, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/lib/supabase";

type Event = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  image_url: string | null;
  starts_at: string | null;
  status: string | null;
  max_attendees: number | null;
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("starts_at", { ascending: true });

      if (error) console.error(error);

      setEvents(data || []);
      setLoading(false);
    }

    loadEvents();
  }, []);

  return (
    <AppShell>
      <PageHeader
        badge="Events"
        title="Upcoming LURP events."
        description="Car meets, fight nights, community stories, business openings and server-wide events."
        icon={CalendarDays}
      />

      <div className="mt-5 flex justify-end">
        <Link
          href="/events/create"
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118] transition hover:scale-[1.02]"
        >
          <Plus size={17} />
          Create Event
        </Link>
      </div>

      {loading && (
        <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#111118] p-8">
          <p className="text-white/55">Loading events...</p>
        </section>
      )}

      {!loading && events.length === 0 && (
        <section className="mt-5 flex min-h-[360px] flex-col items-center justify-center rounded-[2.2rem] border border-white/10 bg-[#111118] p-8 text-center">
          <CalendarDays size={42} className="text-purple-200" />
          <h2 className="mt-5 text-3xl font-black">No events created yet.</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/55">
            Be the first to create a community event for LURP.
          </p>
        </section>
      )}

      {!loading && events.length > 0 && (
        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="group overflow-hidden rounded-[2rem] border border-white/10 bg-[#111118] transition hover:-translate-y-1 hover:bg-white/[0.04]"
            >
              <div className="h-44 border-b border-white/10 bg-[radial-gradient(circle_at_50%_20%,rgba(168,85,247,0.22),transparent_45%)]">
                {event.image_url && (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-200/80">
                  {event.status || "upcoming"}
                </p>

                <h2 className="mt-2 text-2xl font-black">{event.title}</h2>

                {event.description && (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/55">
                    {event.description}
                  </p>
                )}

                <div className="mt-5 grid gap-2 text-sm text-white/50">
                  {event.starts_at && (
                    <p className="flex items-center gap-2">
                      <Clock size={15} />
                      {new Date(event.starts_at).toLocaleString()}
                    </p>
                  )}

                  {event.location && (
                    <p className="flex items-center gap-2">
                      <MapPin size={15} />
                      {event.location}
                    </p>
                  )}

                  {event.max_attendees && (
                    <p className="flex items-center gap-2">
                      <Users size={15} />
                      Max {event.max_attendees} attendees
                    </p>
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