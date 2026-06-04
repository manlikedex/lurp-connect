"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  Clock,
  FileText,
  ImagePlus,
  MapPin,
  Send,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/lib/supabase";

export default function CreateEventPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    time: "",
    maxAttendees: "",
  });

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      alert("Please enter an event title.");
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You need to login with Discord first.");
      setSubmitting(false);
      return;
    }

    let imageUrl: string | null = null;

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("events")
        .upload(fileName, imageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error(uploadError);
        alert(uploadError.message);
        setSubmitting(false);
        return;
      }

      const { data } = supabase.storage.from("events").getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    const startsAt =
      form.date && form.time ? new Date(`${form.date}T${form.time}`).toISOString() : null;

    const { error } = await supabase.from("events").insert({
      created_by: user.id,
      title: form.title,
      description: form.description,
      location: form.location,
      image_url: imageUrl,
      starts_at: startsAt,
      status: "upcoming",
      max_attendees: form.maxAttendees ? Number(form.maxAttendees) : null,
    });

    if (error) {
      console.error(error);
      alert(error.message);
      setSubmitting(false);
      return;
    }

    alert("Event created successfully!");

    setForm({
      title: "",
      description: "",
      location: "",
      date: "",
      time: "",
      maxAttendees: "",
    });

    setImageFile(null);
    setImagePreview(null);
    setSubmitting(false);
  }

  return (
    <AppShell>
      <PageHeader
        badge="Create Event"
        title="Create a LURP event."
        description="Set up car meets, fight nights, business openings, competitions and community moments."
        icon={CalendarDays}
      />

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_390px]">
        <form className="rounded-[2rem] border border-white/10 bg-[#111118] p-5 sm:p-6">
          <Link
            href="/events"
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-white/50 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Events
          </Link>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Event Title"
              placeholder="Example: Underground Car Meet"
              icon={FileText}
              value={form.title}
              onChange={(value) => updateField("title", value)}
            />

            <Field
              label="Location"
              placeholder="Example: East London Docks"
              icon={MapPin}
              value={form.location}
              onChange={(value) => updateField("location", value)}
            />

            <Field
              label="Date"
              placeholder=""
              icon={CalendarDays}
              value={form.date}
              onChange={(value) => updateField("date", value)}
              type="date"
            />

            <Field
              label="Time"
              placeholder=""
              icon={Clock}
              value={form.time}
              onChange={(value) => updateField("time", value)}
              type="time"
            />

            <Field
              label="Max Attendees"
              placeholder="Example: 50"
              icon={Users}
              value={form.maxAttendees}
              onChange={(value) => updateField("maxAttendees", value)}
              type="number"
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-black text-white/70">
              Description
            </label>
            <textarea
              rows={8}
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Describe the event, rules, timings, requirements and what players can expect..."
              className="w-full resize-none rounded-[1.4rem] border border-white/10 bg-white/[0.035] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-purple-300/40 focus:bg-white/[0.055]"
            />
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={17} />
            {submitting ? "Creating..." : "Create Event"}
          </button>
        </form>

        <aside className="rounded-[2rem] border border-white/10 bg-[#111118] p-5">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
            <ImagePlus size={26} />
          </div>

          <h2 className="text-xl font-black">Event Banner</h2>
          <p className="mt-2 text-sm leading-6 text-white/55">
            Upload a banner or event poster.
          </p>

          <label className="mt-5 flex h-64 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.025] text-center transition hover:bg-white/[0.04]">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Event preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <>
                <Camera size={34} className="text-white/35" />
                <p className="mt-3 text-sm font-black text-white/65">
                  Upload Image
                </p>
              </>
            )}

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </aside>
      </section>
    </AppShell>
  );
}

function Field({
  label,
  placeholder,
  icon: Icon,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  placeholder: string;
  icon: typeof FileText;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-white/70">
        {label}
      </span>

      <div className="flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.035] px-4 py-3 transition focus-within:border-purple-300/40 focus-within:bg-white/[0.055]">
        <Icon size={18} className="text-white/35" />
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
        />
      </div>
    </label>
  );
}