"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Camera,
  Globe,
  ImagePlus,
  MessageCircle,
  Send,
  Store,
  Tag,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/lib/supabase";

const categories = [
  "Vehicle Sales",
  "Mechanic",
  "Security",
  "Nightlife",
  "Restaurant",
  "Real Estate",
  "Media",
  "Other",
];

export default function CreateBusinessPage() {
  const [category, setCategory] = useState("Vehicle Sales");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    website: "",
    discord: "",
  });

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleBannerUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  }

  async function uploadBusinessImage(
    file: File | null,
    userId: string,
    type: "logo" | "banner"
  ) {
    if (!file) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${type}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("businesses")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error(`${type} upload error:`, error);
      throw new Error(error.message || `Failed to upload ${type}.`);
    }

    const { data } = supabase.storage
      .from("businesses")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      alert("Please enter a business name.");
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("User error:", userError);
        alert(userError.message);
        setSubmitting(false);
        return;
      }

      if (!user) {
        alert("You need to login with Discord first.");
        setSubmitting(false);
        return;
      }

      const logoUrl = await uploadBusinessImage(logoFile, user.id, "logo");
      const bannerUrl = await uploadBusinessImage(
        bannerFile,
        user.id,
        "banner"
      );

      const payload = {
        owner_id: user.id,
        name: form.name,
        description: form.description,
        category,
        location: form.location,
        logo_url: logoUrl,
        banner_url: bannerUrl,
        website: form.website,
        discord: form.discord,
        status: "approved",
      };

      const { error } = await supabase.from("businesses").insert(payload);

      if (error) {
        console.error("Supabase insert error:", error);
        alert(error.message);
        setSubmitting(false);
        return;
      }

      alert("Business created successfully!");

      setForm({
        name: "",
        description: "",
        location: "",
        website: "",
        discord: "",
      });

      setLogoPreview(null);
      setBannerPreview(null);
      setLogoFile(null);
      setBannerFile(null);
    } catch (error) {
      console.error("Business creation error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to create business. Check console for details."
      );
    }

    setSubmitting(false);
  }

  return (
    <AppShell>
      <PageHeader
        badge="Create Business"
        title="Launch your LURP business."
        description="Create a professional business profile for the community to discover, follow and interact with."
        icon={Store}
      />

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_420px]">
        <form className="rounded-[2rem] border border-white/10 bg-[#111118] p-5 sm:p-6">
          <Link
            href="/businesses"
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-white/50 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Businesses
          </Link>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Business Name"
              placeholder="Example: Underworld Autos"
              icon={Building2}
              value={form.name}
              onChange={(value) => updateField("name", value)}
            />

            <Field
              label="Location"
              placeholder="Example: East London"
              icon={Globe}
              value={form.location}
              onChange={(value) => updateField("location", value)}
            />

            <Field
              label="Website"
              placeholder="Optional website URL"
              icon={Globe}
              value={form.website}
              onChange={(value) => updateField("website", value)}
            />

            <Field
              label="Discord"
              placeholder="Optional Discord invite"
              icon={MessageCircle}
              value={form.discord}
              onChange={(value) => updateField("discord", value)}
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-black text-white/70">
              Description
            </label>
            <textarea
              rows={7}
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Describe what your business does, who it serves, and what makes it stand out..."
              className="w-full resize-none rounded-[1.4rem] border border-white/10 bg-white/[0.035] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-purple-300/40 focus:bg-white/[0.055]"
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-black text-white/70">
              Category
            </label>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`rounded-full border px-4 py-3 text-sm font-black transition ${
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
            {submitting ? "Creating..." : "Create Business"}
          </button>
        </form>

        <aside className="space-y-5">
          <UploadCard
            title="Business Logo"
            description="Upload a square logo for your business profile."
            preview={logoPreview}
            onChange={handleLogoUpload}
            icon="logo"
          />

          <UploadCard
            title="Business Banner"
            description="Upload a wide banner image for your business page."
            preview={bannerPreview}
            onChange={handleBannerUpload}
            icon="banner"
          />

          <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-purple-200 ring-1 ring-white/10">
              <Tag size={21} />
            </div>

            <h2 className="text-xl font-black">Business Profiles</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/55">
              <li>• Promote services to the community</li>
              <li>• Add logo and banner branding</li>
              <li>• Link Discord or external pages</li>
              <li>• Later: employees, posts and gallery</li>
            </ul>
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
  icon: typeof Building2;
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

function UploadCard({
  title,
  description,
  preview,
  onChange,
  icon,
}: {
  title: string;
  description: string;
  preview: string | null;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  icon: "logo" | "banner";
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-5">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
        <ImagePlus size={26} />
      </div>

      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-white/55">{description}</p>

      <label
        className={`mt-5 flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.025] text-center transition hover:bg-white/[0.04] ${
          icon === "banner" ? "h-44" : "h-56"
        }`}
      >
        {preview ? (
          <img
            src={preview}
            alt={title}
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
          onChange={onChange}
          className="hidden"
        />
      </label>
    </div>
  );
}