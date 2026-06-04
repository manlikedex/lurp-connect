"use client";

import {
  ArrowLeft,
  BadgeCheck,
  Box,
  Camera,
  Cuboid,
  Eye,
  FileText,
  ImagePlus,
  Lock,
  Palette,
  Rotate3D,
  Save,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/lib/supabase";
import { awardXp } from "@/lib/xp";
import { unlockAchievement } from "@/lib/achievements";

type Visibility = "public" | "private";

export default function CreateCharacterPage() {
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    age: "",
    occupation: "",
    faction: "",
    shortBio: "",
    backstory: "",
  });

  const completion = useMemo(() => {
    const values = Object.values(form);
    const filled = values.filter((value) => value.trim().length > 0).length;
    return Math.round((filled / values.length) * 100);
  }, [form]);

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedImageFile(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      alert("Please enter a character name.");
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

    let uploadedImageUrl: string | null = null;

    if (selectedImageFile) {
      const fileExt = selectedImageFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("characters")
        .upload(fileName, selectedImageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error(uploadError);
        alert("Failed to upload character image.");
        setSubmitting(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("characters")
        .getPublicUrl(fileName);

      uploadedImageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from("characters").insert({
      owner_id: user.id,
      name: form.name,
      age: form.age,
      occupation: form.occupation,
      faction: form.faction,
      short_bio: form.shortBio,
      backstory: form.backstory,
      image_url: uploadedImageUrl,
      visibility,
      status: "approved",
    });

    if (error) {
      console.error(error);
      alert("Failed to submit character.");
      setSubmitting(false);
      return;
    }

    await awardXp(user.id, "create_character");
    await unlockAchievement(
  user.id,
  "First Character"
);
  
    alert("Character submitted successfully!");

    setForm({
      name: "",
      age: "",
      occupation: "",
      faction: "",
      shortBio: "",
      backstory: "",
    });

    setImagePreview(null);
    setSelectedImageFile(null);
    setSubmitting(false);
  }

  return (
    <AppShell>
      <PageHeader
        badge="Create Character"
        title="Showcase your RP character."
        description="Create a character profile for the LURP community. Soon, members will be able to design a 3D version of their character too."
        icon={UserRound}
      />

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_390px]">
        <form className="rounded-[2rem] border border-white/10 bg-[#111118] p-5 sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link
              href="/characters"
              className="inline-flex items-center gap-2 text-sm font-bold text-white/50 transition hover:text-white"
            >
              <ArrowLeft size={16} />
              Back to Characters
            </Link>

            <span className="rounded-full border border-purple-300/15 bg-purple-300/10 px-3 py-1.5 text-xs font-black text-purple-200">
              {completion}% Complete
            </span>
          </div>

          <div className="mb-6 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-purple-300 transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Character Name"
              placeholder="Example: Marcus Stone"
              icon={UserRound}
              value={form.name}
              onChange={(value) => updateField("name", value)}
            />

            <Field
              label="Age"
              placeholder="Example: 28"
              icon={BadgeCheck}
              value={form.age}
              onChange={(value) => updateField("age", value)}
            />

            <Field
              label="Occupation"
              placeholder="Example: Mechanic, Dealer, Business Owner"
              icon={FileText}
              value={form.occupation}
              onChange={(value) => updateField("occupation", value)}
            />

            <Field
              label="Faction / Group"
              placeholder="Example: Civilian, Police, Gang, Business"
              icon={Lock}
              value={form.faction}
              onChange={(value) => updateField("faction", value)}
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-black text-white/70">
              Short Bio
            </label>
            <textarea
              rows={4}
              value={form.shortBio}
              onChange={(event) => updateField("shortBio", event.target.value)}
              placeholder="Write a short public bio for your character..."
              className="w-full resize-none rounded-[1.4rem] border border-white/10 bg-white/[0.035] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-purple-300/40 focus:bg-white/[0.055]"
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-black text-white/70">
              Backstory
            </label>
            <textarea
              rows={7}
              value={form.backstory}
              onChange={(event) => updateField("backstory", event.target.value)}
              placeholder="Tell the community about your character's story, background, goals and personality..."
              className="w-full resize-none rounded-[1.4rem] border border-white/10 bg-white/[0.035] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-purple-300/40 focus:bg-white/[0.055]"
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-black text-white/70">
              Visibility
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setVisibility("public")}
                className={`rounded-[1.4rem] border p-4 text-left transition ${
                  visibility === "public"
                    ? "border-purple-300/25 bg-purple-300/10"
                    : "border-white/10 bg-white/[0.035] hover:bg-white/[0.055]"
                }`}
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200">
                  <Eye size={18} />
                </div>
                <h3 className="font-black">Public Showcase</h3>
                <p className="mt-1 text-sm leading-6 text-white/50">
                  Display this character to the LURP community.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setVisibility("private")}
                className={`rounded-[1.4rem] border p-4 text-left transition ${
                  visibility === "private"
                    ? "border-purple-300/25 bg-purple-300/10"
                    : "border-white/10 bg-white/[0.035] hover:bg-white/[0.055]"
                }`}
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.04] text-white/60">
                  <Lock size={18} />
                </div>
                <h3 className="font-black">Private Draft</h3>
                <p className="mt-1 text-sm leading-6 text-white/50">
                  Keep this character hidden until you are ready.
                </p>
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/75 transition hover:bg-white/[0.08]"
            >
              <Save size={17} />
              Save Draft
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={17} />
              {submitting ? "Submitting..." : "Submit Character"}
            </button>
          </div>
        </form>

        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-5">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
              <ImagePlus size={26} />
            </div>

            <h2 className="text-xl font-black">Character Portrait</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Upload a portrait or screenshot of your character.
            </p>

            <label className="mt-5 flex h-64 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.025] text-center transition hover:bg-white/[0.04]">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="Character preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <Camera size={34} className="text-white/35" />
                  <p className="mt-3 text-sm font-black text-white/65">
                    Upload Image
                  </p>
                  <p className="mt-1 max-w-48 text-xs leading-5 text-white/35">
                    PNG, JPG or WEBP. Recommended square image.
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
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-5">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
              <Cuboid size={26} />
            </div>

            <h2 className="text-xl font-black">3D Character Studio</h2>

            <p className="mt-2 text-sm leading-6 text-white/55">
              Soon, members will create a 3D version of their character with
              clothing, accessories and pose previews.
            </p>

            <div className="mt-5 flex h-64 items-center justify-center rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_50%_30%,rgba(168,85,247,0.24),transparent_45%)]">
              <div className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white/[0.06] text-purple-200 ring-1 ring-white/10">
                  <Rotate3D size={36} />
                </div>

                <p className="mt-4 text-sm font-black text-white/70">
                  3D Preview Coming Soon
                </p>

                <p className="mt-1 text-xs text-white/40">
                  Ready for Three.js integration
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <StudioFeature icon={Box} title="Body Builder" />
              <StudioFeature icon={Palette} title="Clothing & Colours" />
              <StudioFeature icon={Sparkles} title="Accessories & Pose" />
            </div>
          </div>
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
}: {
  label: string;
  placeholder: string;
  icon: typeof UserRound;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-white/70">
        {label}
      </span>

      <div className="flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.035] px-4 py-3 transition focus-within:border-purple-300/40 focus-within:bg-white/[0.055]">
        <Icon size={18} className="text-white/35" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
        />
      </div>
    </label>
  );
}

function StudioFeature({
  icon: Icon,
  title,
}: {
  icon: typeof Box;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-purple-200">
        <Icon size={17} />
      </div>
      <p className="text-sm font-black text-white/70">{title}</p>
    </div>
  );
}