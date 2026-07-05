"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CalendarClock,
  Eye,
  ImageIcon,
  LinkIcon,
  Save,
  Settings,
  ToggleLeft,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PremiumCard } from "@/components/ui/premium-card";
import { PremiumButton } from "@/components/ui/premium-button";
import { getSiteSetting, saveSiteSetting } from "@/lib/site-settings";

const defaults = {
  site_toggles: {
    developmentBanner: true,
    liveBanner: true,
    latestUpdatesPopup: true,
    notificationPopup: true,
    homepageFeaturedMedia: true,
    homepageOnlineMembers: true,
  },
  homepage_hero: {
    title: "Welcome to LURP Connect.",
    subtitle:
      "Your premium community hub for London Underworld Roleplay — events, media, support, rewards, staff updates and everything happening across the city.",
    primaryText: "Open Community",
    primaryLink: "/community",
    secondaryText: "View Rules",
    secondaryLink: "/rules",
  },
  development_banner: {
    enabled: true,
    message: "LURP Connect is currently in development. Testing is ongoing.",
  },
  live_banner: {
    enabled: true,
    title: "Server is live",
    message: "LURP Connect is available for community testing.",
  },
  countdown_banner: {
    enabled: false,
    title: "Next Server Event",
    message: "Countdown to the next LURP event.",
    targetDate: "",
    buttonText: "View Event",
    buttonLink: "/events",
  },
  server_links: {
    discordInvite: "",
    serverConnectUrl: "",
    rulesUrl: "/rules",
  },
  featured_media: {
    enabled: true,
    title1: "Street Scene",
    title2: "Car Meet",
    title3: "City Lights",
    title4: "Underworld",
  },
};

export default function StaffCMSPage() {
  const [siteToggles, setSiteToggles] = useState(defaults.site_toggles);
  const [homepageHero, setHomepageHero] = useState(defaults.homepage_hero);
  const [developmentBanner, setDevelopmentBanner] = useState(
    defaults.development_banner
  );
  const [liveBanner, setLiveBanner] = useState(defaults.live_banner);
  const [countdownBanner, setCountdownBanner] = useState(
    defaults.countdown_banner
  );
  const [serverLinks, setServerLinks] = useState(defaults.server_links);
  const [featuredMedia, setFeaturedMedia] = useState(defaults.featured_media);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);

    setSiteToggles(await getSiteSetting("site_toggles", defaults.site_toggles));
    setHomepageHero(
      await getSiteSetting("homepage_hero", defaults.homepage_hero)
    );
    setDevelopmentBanner(
      await getSiteSetting("development_banner", defaults.development_banner)
    );
    setLiveBanner(await getSiteSetting("live_banner", defaults.live_banner));
    setCountdownBanner(
      await getSiteSetting("countdown_banner", defaults.countdown_banner)
    );
    setServerLinks(await getSiteSetting("server_links", defaults.server_links));
    setFeaturedMedia(
      await getSiteSetting("featured_media", defaults.featured_media)
    );

    setLoading(false);
  }

  async function saveAll() {
    setSaving(true);

    await saveSiteSetting("site_toggles", siteToggles);
    await saveSiteSetting("homepage_hero", homepageHero);
    await saveSiteSetting("development_banner", developmentBanner);
    await saveSiteSetting("live_banner", liveBanner);
    await saveSiteSetting("countdown_banner", countdownBanner);
    await saveSiteSetting("server_links", serverLinks);
    await saveSiteSetting("featured_media", featuredMedia);

    setSaving(false);
    alert("CMS settings saved.");
  }

  if (loading) {
    return (
      <AppShell>
        <PremiumCard>
          <p className="text-white/55">Loading CMS settings...</p>
        </PremiumCard>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        badge="Staff CMS"
        title="Site content manager."
        description="Control homepage text, banners, countdowns, links and visible site sections without editing code."
        icon={Settings}
      />

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <PremiumCard>
            <SectionHeader
              icon={ToggleLeft}
              title="Site Toggles"
              description="Turn major site modules on or off."
            />

            <div className="grid gap-3 md:grid-cols-2">
              <ToggleField
                label="Development Banner"
                checked={siteToggles.developmentBanner}
                onChange={(value) =>
                  setSiteToggles({
                    ...siteToggles,
                    developmentBanner: value,
                  })
                }
              />

              <ToggleField
                label="Live Server Banner"
                checked={siteToggles.liveBanner}
                onChange={(value) =>
                  setSiteToggles({
                    ...siteToggles,
                    liveBanner: value,
                  })
                }
              />

              <ToggleField
                label="Latest Updates Popup"
                checked={siteToggles.latestUpdatesPopup}
                onChange={(value) =>
                  setSiteToggles({
                    ...siteToggles,
                    latestUpdatesPopup: value,
                  })
                }
              />

              <ToggleField
                label="Notification Permission Popup"
                checked={siteToggles.notificationPopup}
                onChange={(value) =>
                  setSiteToggles({
                    ...siteToggles,
                    notificationPopup: value,
                  })
                }
              />

              <ToggleField
                label="Homepage Featured Media"
                checked={siteToggles.homepageFeaturedMedia}
                onChange={(value) =>
                  setSiteToggles({
                    ...siteToggles,
                    homepageFeaturedMedia: value,
                  })
                }
              />

              <ToggleField
                label="Homepage Online Members"
                checked={siteToggles.homepageOnlineMembers}
                onChange={(value) =>
                  setSiteToggles({
                    ...siteToggles,
                    homepageOnlineMembers: value,
                  })
                }
              />
            </div>
          </PremiumCard>

          <PremiumCard>
            <SectionHeader
              icon={Eye}
              title="Homepage Hero"
              description="Main homepage headline, description and buttons."
            />

            <Field label="Title">
              <input
                className="input-premium"
                value={homepageHero.title}
                onChange={(e) =>
                  setHomepageHero({ ...homepageHero, title: e.target.value })
                }
              />
            </Field>

            <Field label="Subtitle">
              <textarea
                rows={4}
                className="input-premium resize-none"
                value={homepageHero.subtitle}
                onChange={(e) =>
                  setHomepageHero({
                    ...homepageHero,
                    subtitle: e.target.value,
                  })
                }
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Primary Button Text">
                <input
                  className="input-premium"
                  value={homepageHero.primaryText}
                  onChange={(e) =>
                    setHomepageHero({
                      ...homepageHero,
                      primaryText: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Primary Button Link">
                <input
                  className="input-premium"
                  value={homepageHero.primaryLink}
                  onChange={(e) =>
                    setHomepageHero({
                      ...homepageHero,
                      primaryLink: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Secondary Button Text">
                <input
                  className="input-premium"
                  value={homepageHero.secondaryText}
                  onChange={(e) =>
                    setHomepageHero({
                      ...homepageHero,
                      secondaryText: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Secondary Button Link">
                <input
                  className="input-premium"
                  value={homepageHero.secondaryLink}
                  onChange={(e) =>
                    setHomepageHero({
                      ...homepageHero,
                      secondaryLink: e.target.value,
                    })
                  }
                />
              </Field>
            </div>
          </PremiumCard>

          <PremiumCard>
            <SectionHeader
              icon={Bell}
              title="Banners"
              description="Edit development and live server banner messaging."
            />

            <ToggleField
              label="Development Banner Enabled"
              checked={developmentBanner.enabled}
              onChange={(value) =>
                setDevelopmentBanner({
                  ...developmentBanner,
                  enabled: value,
                })
              }
            />

            <Field label="Development Banner Message">
              <textarea
                rows={3}
                className="input-premium resize-none"
                value={developmentBanner.message}
                onChange={(e) =>
                  setDevelopmentBanner({
                    ...developmentBanner,
                    message: e.target.value,
                  })
                }
              />
            </Field>

            <div className="mt-5 border-t border-white/10 pt-5">
              <ToggleField
                label="Live Banner Enabled"
                checked={liveBanner.enabled}
                onChange={(value) =>
                  setLiveBanner({ ...liveBanner, enabled: value })
                }
              />

              <Field label="Live Banner Title">
                <input
                  className="input-premium"
                  value={liveBanner.title}
                  onChange={(e) =>
                    setLiveBanner({ ...liveBanner, title: e.target.value })
                  }
                />
              </Field>

              <Field label="Live Banner Message">
                <textarea
                  rows={3}
                  className="input-premium resize-none"
                  value={liveBanner.message}
                  onChange={(e) =>
                    setLiveBanner({ ...liveBanner, message: e.target.value })
                  }
                />
              </Field>
            </div>
          </PremiumCard>

          <PremiumCard>
            <SectionHeader
              icon={CalendarClock}
              title="Countdown Banner"
              description="Create a site-wide countdown for events, releases or launches."
            />

            <ToggleField
              label="Countdown Enabled"
              checked={countdownBanner.enabled}
              onChange={(value) =>
                setCountdownBanner({
                  ...countdownBanner,
                  enabled: value,
                })
              }
            />

            <Field label="Countdown Title">
              <input
                className="input-premium"
                value={countdownBanner.title}
                onChange={(e) =>
                  setCountdownBanner({
                    ...countdownBanner,
                    title: e.target.value,
                  })
                }
              />
            </Field>

            <Field label="Countdown Message">
              <textarea
                rows={3}
                className="input-premium resize-none"
                value={countdownBanner.message}
                onChange={(e) =>
                  setCountdownBanner({
                    ...countdownBanner,
                    message: e.target.value,
                  })
                }
              />
            </Field>

            <Field label="Target Date/Time">
              <input
                type="datetime-local"
                className="input-premium"
                value={countdownBanner.targetDate}
                onChange={(e) =>
                  setCountdownBanner({
                    ...countdownBanner,
                    targetDate: e.target.value,
                  })
                }
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Button Text">
                <input
                  className="input-premium"
                  value={countdownBanner.buttonText}
                  onChange={(e) =>
                    setCountdownBanner({
                      ...countdownBanner,
                      buttonText: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Button Link">
                <input
                  className="input-premium"
                  value={countdownBanner.buttonLink}
                  onChange={(e) =>
                    setCountdownBanner({
                      ...countdownBanner,
                      buttonLink: e.target.value,
                    })
                  }
                />
              </Field>
            </div>
          </PremiumCard>

          <PremiumCard>
            <SectionHeader
              icon={LinkIcon}
              title="Server Links"
              description="Manage important public links used across the app."
            />

            <Field label="Discord Invite">
              <input
                className="input-premium"
                value={serverLinks.discordInvite}
                onChange={(e) =>
                  setServerLinks({
                    ...serverLinks,
                    discordInvite: e.target.value,
                  })
                }
              />
            </Field>

            <Field label="FiveM Connect URL">
              <input
                className="input-premium"
                value={serverLinks.serverConnectUrl}
                onChange={(e) =>
                  setServerLinks({
                    ...serverLinks,
                    serverConnectUrl: e.target.value,
                  })
                }
              />
            </Field>

            <Field label="Rules URL">
              <input
                className="input-premium"
                value={serverLinks.rulesUrl}
                onChange={(e) =>
                  setServerLinks({
                    ...serverLinks,
                    rulesUrl: e.target.value,
                  })
                }
              />
            </Field>
          </PremiumCard>

          <PremiumCard>
            <SectionHeader
              icon={ImageIcon}
              title="Featured Media"
              description="Control the featured media card labels."
            />

            <ToggleField
              label="Featured Media Enabled"
              checked={featuredMedia.enabled}
              onChange={(value) =>
                setFeaturedMedia({
                  ...featuredMedia,
                  enabled: value,
                })
              }
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Media Card 1">
                <input
                  className="input-premium"
                  value={featuredMedia.title1}
                  onChange={(e) =>
                    setFeaturedMedia({
                      ...featuredMedia,
                      title1: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Media Card 2">
                <input
                  className="input-premium"
                  value={featuredMedia.title2}
                  onChange={(e) =>
                    setFeaturedMedia({
                      ...featuredMedia,
                      title2: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Media Card 3">
                <input
                  className="input-premium"
                  value={featuredMedia.title3}
                  onChange={(e) =>
                    setFeaturedMedia({
                      ...featuredMedia,
                      title3: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Media Card 4">
                <input
                  className="input-premium"
                  value={featuredMedia.title4}
                  onChange={(e) =>
                    setFeaturedMedia({
                      ...featuredMedia,
                      title4: e.target.value,
                    })
                  }
                />
              </Field>
            </div>
          </PremiumCard>
        </div>

        <aside className="space-y-5">
          <PremiumCard>
            <h2 className="text-xl font-black">CMS Controls</h2>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Changes saved here can be connected to public pages, banners,
              countdowns and homepage modules.
            </p>

            <PremiumButton
              onClick={saveAll}
              disabled={saving}
              className="mt-5 w-full"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save CMS Settings"}
            </PremiumButton>
          </PremiumCard>

          <PremiumCard>
            <h2 className="text-xl font-black">Recommended Use</h2>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Use this panel for temporary announcements, event countdowns,
              development status updates and toggling homepage sections during
              maintenance.
            </p>
          </PremiumCard>
        </aside>
      </section>
    </AppShell>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Settings;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
        <Icon size={22} />
      </div>

      <div>
        <h2 className="text-2xl font-black tracking-[-0.035em]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-white/45">{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-4 block">
      <span className="mb-2 block text-sm font-black text-white/70">
        {label}
      </span>
      {children}
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between gap-4 rounded-[1.3rem] border p-4 text-left transition ${
        checked
          ? "border-emerald-300/20 bg-emerald-400/10"
          : "border-white/10 bg-white/[0.035]"
      }`}
    >
      <span className="text-sm font-black text-white/75">{label}</span>

      <span
        className={`rounded-full px-3 py-1 text-xs font-black ${
          checked
            ? "bg-emerald-300 text-[#101017]"
            : "bg-white/10 text-white/45"
        }`}
      >
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}