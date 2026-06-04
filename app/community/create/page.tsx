"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  FileText,
  ImagePlus,
  Send,
  Tag,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/lib/supabase";
import { awardXp } from "@/lib/xp";
import { unlockAchievement } from "@/lib/achievements";

const categories = ["community", "business", "event", "recruitment", "media"];

export default function CreateCommunityPostPage() {
  const [category, setCategory] = useState("community");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
  });

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      alert("Please enter a post title.");
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
        .from("posts")
        .upload(fileName, selectedImageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error(uploadError);
        alert("Failed to upload post image.");
        setSubmitting(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("posts")
        .getPublicUrl(fileName);

      uploadedImageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from("posts").insert({
      author_id: user.id,
      title: form.title,
      content: form.content,
      category,
      image_url: uploadedImageUrl,
      status: "published",
    });

    if (error) {
      console.error(error);
      alert("Failed to create post.");
      setSubmitting(false);
      return;
    }

    await awardXp(user.id, "create_post");
    await unlockAchievement(
  user.id,
  "First Post"
);

    alert("Post created successfully!");

    setForm({ title: "", content: "" });
    setImagePreview(null);
    setSelectedImageFile(null);
    setSubmitting(false);
  }

  return (
    <AppShell>
      <PageHeader
        badge="Create Post"
        title="Share something with LURP."
        description="Post community updates, screenshots, business adverts, event news, recruitment posts and RP stories."
        icon={FileText}
      />

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_390px]">
        <form className="rounded-[2rem] border border-white/10 bg-[#111118] p-5 sm:p-6">
          <Link
            href="/community"
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-white/50 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Community
          </Link>

          <label className="block">
            <span className="mb-2 block text-sm font-black text-white/70">
              Post Title
            </span>

            <div className="flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.035] px-4 py-3 transition focus-within:border-purple-300/40 focus-within:bg-white/[0.055]">
              <FileText size={18} className="text-white/35" />
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Example: Tonight's car meet is live"
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
              />
            </div>
          </label>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-black text-white/70">
              Post Content
            </label>
            <textarea
              rows={9}
              value={form.content}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  content: event.target.value,
                }))
              }
              placeholder="Write your update, story, announcement or advert..."
              className="w-full resize-none rounded-[1.4rem] border border-white/10 bg-white/[0.035] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-purple-300/40 focus:bg-white/[0.055]"
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-black text-white/70">
              Category
            </label>

            <div className="grid gap-3 sm:grid-cols-3">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`rounded-full border px-4 py-3 text-sm font-black capitalize transition ${
                    category === item
                      ? "border-purple-300/25 bg-purple-300/10 text-purple-100"
                      : "border-white/10 bg-white/[0.035] text-white/55 hover:bg-white/[0.055]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={17} />
            {submitting ? "Publishing..." : "Publish Post"}
          </button>
        </form>

        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-5">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
              <ImagePlus size={26} />
            </div>

            <h2 className="text-xl font-black">Post Image</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Add a screenshot, event poster, business advert or RP moment.
            </p>

            <label className="mt-5 flex h-64 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.025] text-center transition hover:bg-white/[0.04]">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Post preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <Camera size={34} className="text-white/35" />
                  <p className="mt-3 text-sm font-black text-white/65">
                    Upload Image
                  </p>
                  <p className="mt-1 max-w-48 text-xs leading-5 text-white/35">
                    PNG, JPG or WEBP.
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
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-purple-200 ring-1 ring-white/10">
              <Tag size={21} />
            </div>

            <h2 className="text-xl font-black">Post Types</h2>

            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/55">
              <li>• Community updates and RP stories</li>
              <li>• Business adverts and openings</li>
              <li>• Event announcements</li>
              <li>• Recruitment and faction posts</li>
              <li>• Screenshots and media moments</li>
            </ul>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}