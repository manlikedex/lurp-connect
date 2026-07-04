"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Car,
  ChevronDown,
  MessageCircle,
  Scale,
  Search,
  ShieldCheck,
  Siren,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";

type Rule = {
  number: number;
  title: string;
  category: string;
  description: string;
  allowed?: string[];
  notAllowed?: string[];
};

const categories = [
  "All",
  "General",
  "Roleplay",
  "Combat",
  "Vehicles",
  "Communication",
  "Crime",
  "Fair Play",
];

const rules: Rule[] = [
  {
    number: 1,
    title: "Respect Everyone",
    category: "General",
    description:
      "Treat all players, staff and community members with respect. Racism, sexism, harassment, bullying, discrimination, hate speech, toxicity and excessive trolling are not allowed.",
    allowed: ["In-character arguments", "Friendly banter between players"],
    notAllowed: [
      "Real-life insults",
      "Targeting players personally",
      "Harassing players through DMs, voice chat or text chat",
    ],
  },
  {
    number: 2,
    title: "Use Common Sense",
    category: "General",
    description:
      "If something ruins roleplay or gives an unfair advantage, do not do it. Staff may punish actions not specifically listed if they clearly damage gameplay or the community.",
    allowed: ["Reporting bugs to staff", "Playing realistically"],
    notAllowed: [
      "Abusing loopholes because it is not listed",
      "Ruining scenes intentionally for laughs",
    ],
  },
  {
    number: 3,
    title: "Serious Roleplay",
    category: "Roleplay",
    description:
      "Serious roleplay must be maintained at all times. Stay in character during active scenes unless staff says otherwise.",
    allowed: ["Acting injured after a crash", "Speaking realistically"],
    notAllowed: [
      "Playing meme sounds during hostage RP",
      "Dancing during shootings or serious scenes",
    ],
  },
  {
    number: 4,
    title: "No Random Deathmatch",
    category: "Combat",
    description:
      "Killing or attacking players without a valid roleplay reason is prohibited. Proper escalation must happen before violence.",
    allowed: [
      "Shooting after a robbery escalates properly",
      "Defending yourself from a legitimate threat",
    ],
    notAllowed: [
      "Punching random people for no reason",
      "Shooting players because they annoyed you",
    ],
  },
  {
    number: 5,
    title: "No Vehicle Deathmatch",
    category: "Vehicles",
    description: "Vehicles cannot be used as weapons.",
    allowed: ["Accidentally hitting someone during a chase"],
    notAllowed: [
      "Driving into crowds intentionally",
      "Repeatedly running people over",
    ],
  },
  {
    number: 6,
    title: "No Metagaming",
    category: "Roleplay",
    description:
      "Metagaming is using information your character would not realistically know. Information gained outside the game cannot be used in RP.",
    allowed: ["Learning information through RP", "Using in-game phones and radios"],
    notAllowed: [
      "Watching streams to find players",
      "Using Discord calls to share police locations",
      "Using names from player IDs before learning them in RP",
      "Telling friends your location while kidnapped or unconscious",
    ],
  },
  {
    number: 7,
    title: "No Powergaming",
    category: "Roleplay",
    description:
      "Do not force unrealistic actions or outcomes onto players. Players must have time to respond.",
    allowed: ["Giving players time to react", "Roleplaying injuries properly"],
    notAllowed: [
      "/me knocks person out instantly",
      "/me steals weapon before reaction",
      "Ignoring injuries after crashes or shootings",
      "Escaping restraints unrealistically",
    ],
  },
  {
    number: 8,
    title: "No FailRP",
    category: "Roleplay",
    description:
      "Roleplay realistically at all times. Value your life and act appropriately in situations.",
    allowed: [
      "Surrendering when heavily outnumbered",
      "Seeking medical help after injuries",
    ],
    notAllowed: [
      "Jumping off buildings and continuing normally",
      "Acting fearless in impossible situations",
      "Ignoring being shot or seriously injured",
    ],
  },
  {
    number: 9,
    title: "No Combat Logging",
    category: "Fair Play",
    description:
      "Logging out to avoid roleplay or consequences is prohibited.",
    allowed: ["Finishing scenes before disconnecting"],
    notAllowed: [
      "Leaving during police chases",
      "Disconnecting during robberies or kidnappings",
    ],
  },
  {
    number: 10,
    title: "New Life Rule",
    category: "Roleplay",
    description:
      "After death, you forget the events leading up to your death and may not return to the same active scene.",
    allowed: ["Respawning and continuing new RP"],
    notAllowed: ["Returning for revenge", "Returning to loot your own body"],
  },
  {
    number: 11,
    title: "No Exploiting or Cheating",
    category: "Fair Play",
    description:
      "Cheats, exploits, scripts, mod menus, duplicated items and bug abuse are prohibited.",
    allowed: ["Reporting bugs to staff"],
    notAllowed: [
      "ESP or wallhacks",
      "Aim assist or recoil scripts",
      "Duplication glitches",
      "Money exploits",
    ],
  },
  {
    number: 12,
    title: "Character Names",
    category: "Roleplay",
    description:
      "Character names must be realistic and serious. No celebrity names, fictional characters, meme names or unrealistic names.",
    allowed: ["James Carter", "Olivia Smith"],
    notAllowed: ["xXDrugLord420Xx", "PoliceKillerYT", "John Wick"],
  },
  {
    number: 13,
    title: "FearRP / Value of Life",
    category: "Roleplay",
    description:
      "Your character must realistically fear death and serious injury.",
    allowed: ["Cooperating during dangerous situations", "Acting realistically under threat"],
    notAllowed: [
      "Talking trash while outnumbered at gunpoint",
      "Pulling weapons while already being aimed at",
      "Trying to fist fight armed police",
    ],
  },
  {
    number: 14,
    title: "Mic & Communication Rules",
    category: "Communication",
    description:
      "A working microphone is required and clear communication must be maintained.",
    allowed: ["Speaking clearly in RP"],
    notAllowed: [
      "Mic spamming",
      "Screaming",
      "Playing loud music through a microphone",
      "Soundboards disrupting RP",
    ],
  },
  {
    number: 15,
    title: "Safe Zones",
    category: "General",
    description:
      "No hostile actions inside designated safe zones unless stated otherwise. Safe zones may not be used to avoid ongoing roleplay.",
    allowed: ["Meeting peacefully at dealerships or hospitals"],
    notAllowed: [
      "Shooting or robbing players in safe zones",
      "Waiting outside safe zones for players",
      "Entering a safe zone to avoid roleplay or police",
    ],
  },
  {
    number: 16,
    title: "Hostage Rules",
    category: "Crime",
    description:
      "Hostages must have a valid roleplay purpose. Friends, gang members or accomplices may not be used repeatedly as hostages.",
    allowed: ["Taking a random civilian hostage during a robbery"],
    notAllowed: [
      "Using your friend as a hostage every robbery",
      "Taking hostages solely for negotiations",
    ],
  },
  {
    number: 17,
    title: "Reporting Players",
    category: "General",
    description:
      "Reports must be truthful and include evidence where possible.",
    allowed: ["Providing clips or screenshots", "Reporting rule breaks honestly"],
    notAllowed: ["False reporting", "Report spam"],
  },
  {
    number: 18,
    title: "Streaming & Content",
    category: "Communication",
    description:
      "Stream sniping is prohibited. Content creators must follow all server rules.",
    allowed: ["Recording normal gameplay and content"],
    notAllowed: [
      "Using streams to locate players",
      "Watching active scenes to gain information",
    ],
  },
  {
    number: 19,
    title: "Ban Evasion",
    category: "Fair Play",
    description:
      "Using alternate accounts to avoid punishments is prohibited.",
    allowed: ["Appealing bans properly"],
    notAllowed: [
      "Joining on another account after a ban",
      "Using friends' accounts to bypass punishment",
    ],
  },
  {
    number: 20,
    title: "Third-Party Software",
    category: "Fair Play",
    description:
      "Any software giving an unfair advantage is prohibited.",
    allowed: ["Graphics mods or ReShade"],
    notAllowed: [
      "Crosshair overlays",
      "Macro or recoil scripts",
      "Cheat menus or injectors",
      "VPNs used to evade punishments",
    ],
  },
  {
    number: 21,
    title: "Community Conduct",
    category: "General",
    description: "Help keep the server enjoyable and realistic.",
    allowed: ["Helping new players", "Creating enjoyable RP for others"],
    notAllowed: ["Constant trolling", "Intentionally ruining RP scenes"],
  },
  {
    number: 22,
    title: "OOC Rules",
    category: "Communication",
    description:
      "Keep OOC chat respectful and minimal during RP. OOC arguments should not affect roleplay.",
    allowed: ["Asking quick technical questions"],
    notAllowed: [
      "Bringing OOC drama into RP",
      "Insulting players through OOC chat",
    ],
  },
  {
    number: 23,
    title: "Discord Rules",
    category: "Communication",
    description:
      "Server Discord rules apply the same as in-game rules. Toxicity, harassment and leaks are prohibited.",
    allowed: ["Using support channels correctly"],
    notAllowed: [
      "Posting private conversations without permission",
      "Toxic behaviour in Discord voice or text channels",
      "Using Discord calls for metagaming",
    ],
  },
  {
    number: 24,
    title: "Roleplay Quality",
    category: "Roleplay",
    description:
      "Low-effort or unrealistic roleplay may be punished. Create roleplay that benefits everyone involved.",
    allowed: [
      "Proper negotiations during robberies",
      "Detailed character interactions",
    ],
    notAllowed: [
      "One-word responses during serious RP",
      "Constantly looking for gunfights only",
    ],
  },
  {
    number: 25,
    title: "Advertising",
    category: "General",
    description:
      "Advertising other servers, Discords, communities or services is prohibited without permission.",
    allowed: ["Sharing media or content with staff approval"],
    notAllowed: [
      "Sending server invites in chat or DMs",
      "Promoting other communities in voice chat",
    ],
  },
  {
    number: 26,
    title: "No Cop Baiting",
    category: "Crime",
    description:
      "Intentionally provoking law enforcement solely to create a chase or interaction is prohibited.",
    allowed: ["Natural criminal roleplay leading to police involvement"],
    notAllowed: [
      "Driving circles around police to start a pursuit",
      "Insulting officers to force interactions",
      "Creating unrealistic situations just to attract police",
    ],
  },
  {
    number: 27,
    title: "Roleplay Before Gunplay",
    category: "Combat",
    description:
      "Roleplay should always be prioritised over immediate violence whenever reasonable.",
    allowed: ["Attempting negotiations first", "Escalating situations naturally"],
    notAllowed: [
      "Immediately shooting because someone insulted you",
      "Looking for excuses to start gunfights",
    ],
  },
  {
    number: 28,
    title: "Revenge Roleplay",
    category: "Roleplay",
    description:
      "Revenge roleplay must remain realistic and comply with NLR. Players cannot immediately seek revenge after losing a situation.",
    allowed: ["Building a realistic storyline over time"],
    notAllowed: [
      "Hunting players down immediately after a loss",
      "Using OOC information to plan revenge",
    ],
  },
  {
    number: 29,
    title: "New Player Protection",
    category: "General",
    description:
      "Experienced players may not intentionally target, scam or exploit obvious new players.",
    allowed: [
      "Helping new players learn server systems",
      "Directing new players to community resources",
    ],
    notAllowed: [
      "Repeatedly robbing new players",
      "Taking advantage of players unfamiliar with server mechanics",
    ],
  },
  {
    number: 30,
    title: "Criminal Cooldown",
    category: "Crime",
    description:
      "Repeatedly performing the same criminal activity solely for money or action is prohibited. Allow roleplay to develop naturally between major criminal activities.",
    allowed: [
      "Creating varied criminal roleplay",
      "Developing storylines between crimes",
    ],
    notAllowed: [
      "Repeatedly robbing the same location",
      "Constantly seeking shootouts without meaningful RP",
    ],
  },
];

const categoryIcons = {
  General: Users,
  Roleplay: BadgeCheck,
  Combat: Siren,
  Vehicles: Car,
  Communication: MessageCircle,
  Crime: Scale,
  "Fair Play": ShieldCheck,
};

export default function RulesPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [openRule, setOpenRule] = useState<number | null>(1);

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchesCategory =
        activeCategory === "All" || rule.category === activeCategory;

      const searchText = `${rule.number} ${rule.title} ${rule.category} ${
        rule.description
      } ${(rule.allowed || []).join(" ")} ${(rule.notAllowed || []).join(" ")}`;

      const matchesSearch = searchText
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  return (
    <AppShell>
      <PageHeader
        badge="Rules & Guidelines"
        title="LURP server rules."
        description="Search and browse the official London Underworld Roleplay rules by category."
        icon={ShieldCheck}
      />

      <section className="mt-5 rounded-[2rem] border border-amber-400/20 bg-amber-500/10 p-5">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300 ring-1 ring-amber-300/15">
            <AlertTriangle size={24} />
          </div>

          <div>
            <h2 className="text-xl font-black text-amber-200">
              Rules are subject to change
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-100/70">
              These rules are here to keep roleplay fair, realistic and enjoyable
              for everyone. Staff may act on behaviour that damages the server,
              even if it is not directly listed.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-5">
            <div className="flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.035] px-4 py-3">
              <Search size={18} className="text-white/35" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search rules..."
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-3">
            <div className="flex gap-2 overflow-x-auto xl:block xl:space-y-2">
              {categories.map((category) => {
                const Icon =
                  category === "All"
                    ? ShieldCheck
                    : categoryIcons[category as keyof typeof categoryIcons] ||
                      ShieldCheck;

                const active = activeCategory === category;

                return (
                  <button
                    key={category}
                    onClick={() => {
                      setActiveCategory(category);
                      setOpenRule(null);
                    }}
                    className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition xl:w-full ${
                      active
                        ? "bg-white text-[#111118]"
                        : "text-white/50 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <Icon size={17} />
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="space-y-3">
          <div className="mb-2 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">
                {activeCategory === "All" ? "All Rules" : activeCategory}
              </h2>
              <p className="mt-1 text-sm text-white/45">
                Showing {filteredRules.length} rule
                {filteredRules.length === 1 ? "" : "s"}.
              </p>
            </div>
          </div>

          {filteredRules.map((rule) => {
            const isOpen = openRule === rule.number;

            return (
              <article
                key={rule.number}
                className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#111118]"
              >
                <button
                  onClick={() => setOpenRule(isOpen ? null : rule.number)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-200/70">
                      Rule {rule.number} · {rule.category}
                    </p>
                    <h3 className="mt-1 text-xl font-black">{rule.title}</h3>
                  </div>

                  <ChevronDown
                    size={20}
                    className={`shrink-0 text-white/40 transition ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-white/10 p-5 pt-0">
                    <p className="mt-5 text-sm leading-7 text-white/65">
                      {rule.description}
                    </p>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      {rule.allowed && rule.allowed.length > 0 && (
                        <div className="rounded-[1.3rem] border border-emerald-300/15 bg-emerald-400/10 p-4">
                          <p className="text-sm font-black text-emerald-300">
                            Allowed Examples
                          </p>

                          <div className="mt-3 space-y-2">
                            {rule.allowed.map((item) => (
                              <p
                                key={item}
                                className="text-sm leading-6 text-emerald-100/70"
                              >
                                ✅ {item}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {rule.notAllowed && rule.notAllowed.length > 0 && (
                        <div className="rounded-[1.3rem] border border-red-300/15 bg-red-400/10 p-4">
                          <p className="text-sm font-black text-red-300">
                            Not Allowed
                          </p>

                          <div className="mt-3 space-y-2">
                            {rule.notAllowed.map((item) => (
                              <p
                                key={item}
                                className="text-sm leading-6 text-red-100/70"
                              >
                                ❌ {item}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}

          {filteredRules.length === 0 && (
            <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-8 text-center">
              <h2 className="text-2xl font-black">No rules found</h2>
              <p className="mt-2 text-sm text-white/50">
                Try searching for something else.
              </p>
            </div>
          )}
        </section>
      </section>
    </AppShell>
  );
}