import Link from "next/link";
import {
  Building2,
  CalendarDays,
  Camera,
  MessageSquarePlus,
  UserRound,
  Users,
} from "lucide-react";

const actions = [
  {
    title: "Create Character",
    href: "/characters/create",
    icon: UserRound,
  },
  {
    title: "Create Business",
    href: "/businesses/create",
    icon: Building2,
  },
  {
    title: "Create Post",
    href: "/feed/create",
    icon: MessageSquarePlus,
  },
{
  title: "Gallery",
  href: "/gallery",
  icon: Camera,
},
{
  title: "Events",
  href: "/events",
  icon: CalendarDays,
},
  {
    title: "Community",
    href: "/feed",
    icon: Users,
  },
];

export function QuickActions() {
  return (
    <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
      {actions.map((action) => (
        <Link
          key={action.title}
          href={action.href}
          className="
            group
            rounded-[1.5rem]
            border
            border-white/10
            bg-[#111118]
            p-5
            transition
            hover:-translate-y-1
            hover:border-purple-300/25
          "
        >
          <action.icon
            size={26}
            className="text-purple-200"
          />

          <h3 className="mt-4 font-black">
            {action.title}
          </h3>
        </Link>
      ))}
    </section>
  );
}