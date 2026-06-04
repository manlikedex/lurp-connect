"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, FileText, ImagePlus, Send } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/lib/supabase";
import { awardXp } from "@/lib/xp";
import { unlockAchievement } from "@/lib/achievements";

export default function UploadGalleryPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setMediaFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!mediaFile || !form.title.trim()) {
      alert("Please add an image and title.");
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

    const fileExt = mediaFile.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(fileName, mediaFile);

    if (uploadError) {
      alert(uploadError.message);
      setSubmitting(false);
      return;
    }

    const { data } = supabase.storage.from("gallery").getPublicUrl(fileName);

    const { error } = await supabase.from("media").insert({
      uploaded_by: user.id,
      title: form.title,
      description: form.description,
      file_url: data.publicUrl,
      file_type: "image",
      category: "community",
      status: "approved",
    });

    if (error) {
      alert(error.message);
      setSubmitting(false);
      return;
    }

    await awardXp(user.id, "upload_media");
    await unlockAchievement(
  user.id,
  "First Upload"
);

    alert("Media uploaded successfully!");
    setForm({ title: "", description: "" });
    setPreview(null);
    setMediaFile(null);
    setSubmitting(false);
  }

  return (
    <AppShell>
      <PageHeader
        badge="Upload Media"
        title="Share a LURP moment."
        description="Upload screenshots, event photos, character shots and community highlights."
        icon={Camera}
      />

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_420px]">
        <form className="rounded-[2rem] border border-white/10 bg-[#111118] p-5 sm:p-6">
          <Link
            href="/gallery"
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Gallery
          </Link>

          <label className="block">
            <span className="mb-2 block text-sm font-black text-white/70">
              Title
            </span>

            <div className="flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.035] px-4 py-3">
              <FileText size={18} className="text-white/35" />
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Example: Midnight car meet"
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
              />
            </div>
          </label>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-black text-white/70">
              Description
            </label>

            <textarea
              rows={7}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Describe the moment..."
              className="w-full resize-none rounded-[1.4rem] border border-white/10 bg-white/[0.035] px-4 py-4 text-sm text-white outline-none placeholder:text-white/25"
            />
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118] disabled:opacity-60"
          >
            <Send size={17} />
            {submitting ? "Uploading..." : "Upload Media"}
          </button>
        </form>

        <aside className="rounded-[2rem] border border-white/10 bg-[#111118] p-5">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200">
            <ImagePlus size={26} />
          </div>

          <h2 className="text-xl font-black">Media Image</h2>

          <label className="mt-5 flex h-80 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.025] text-center">
            {preview ? (
              <img
                src={preview}
                alt="Gallery preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <>
                <Camera size={38} className="text-white/35" />
                <p className="mt-3 text-sm font-black text-white/65">
                  Upload Image
                </p>
              </>
            )}

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </aside>
      </section>
    </AppShell>
  );
}