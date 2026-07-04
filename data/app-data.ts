import {
  BadgeCheck,
  CalendarDays,
  Camera,
  Gift,
  Home,
  ImageIcon,
  MessageCircle,
  Shield,
  ShieldCheck,
  Settings,
  Store,
  Trophy,
  User,
  Users,
  LifeBuoy,
} from "lucide-react";


export const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Rules", href: "/rules", icon: ShieldCheck },
  { label: "Community", href: "/community", icon: MessageCircle },
  { label: "Support", href: "/support", icon: LifeBuoy },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Gallery", href: "/gallery", icon: Camera },
  { label: "Businesses", href: "/businesses", icon: Store },
  { label: "Characters", href: "/characters", icon: Users },
  { label: "Achievements", href: "/achievements", icon: Trophy },
  { label: "Rewards", href: "/rewards", icon: Gift },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },

 
];

export const featureCards = [
  {
    title: "Community Feed",
    description: "Announcements, updates and player highlights.",
    icon: MessageCircle,
  },
  {
    title: "Events",
    description: "Car meets, fight nights, races and roleplay stories.",
    icon: CalendarDays,
  },
  {
    title: "Gallery",
    description: "Screenshots, clips and featured community moments.",
    icon: ImageIcon,
  },
  {
    title: "Businesses",
    description: "Discover player-run businesses across London.",
    icon: Store,
  },
  {
    title: "Rewards",
    description: "Earn badges, XP and community recognition.",
    icon: Gift,
  },
  {
    title: "Rules & Guides",
    description: "Quick access to important player information.",
    icon: Shield,
  },
];

export const updates = [
  {
    tag: "Announcement",
    title: "Welcome to LURP Connect",
    description:
      "The official community platform for London Underworld Roleplay.",
  },
  {
    tag: "Event",
    title: "Underground Car Meet",
    description: "Tonight at 8PM. Bring your cleanest build.",
  },
  {
    tag: "Community",
    title: "Screenshot Competition",
    description: "Submit your best RP moment to be featured.",
  },
];

export const stats = [
  { label: "Players Online", value: "247 / 300", icon: Users },
  { label: "Upcoming Events", value: "4", icon: CalendarDays },
  { label: "Community Posts", value: "128", icon: MessageCircle },
];

export const businesses = [
  {
    name: "Underworld Autos",
    category: "Vehicle Sales",
    owner: "Marcus Stone",
    location: "East London",
    description: "Premium vehicle sales, imports and custom builds.",
  },
  {
    name: "LURP Customs",
    category: "Mechanic",
    owner: "Kai Brooks",
    location: "South London",
    description: "Repairs, resprays, performance tuning and show builds.",
  },
  {
    name: "East End Security",
    category: "Security",
    owner: "Dylan Carter",
    location: "City Centre",
    description: "Private security for events, businesses and VIP clients.",
  },
  {
    name: "Midnight Lounge",
    category: "Nightlife",
    owner: "Ava Knight",
    location: "West London",
    description: "A late-night social venue for the LURP community.",
  },
];

export const characters = [
  {
    name: "Marcus Stone",
    role: "Business Owner",
    faction: "Civilian",
    bio: "Known across London for high-end vehicle imports and underground connections.",
  },
  {
    name: "Ava Knight",
    role: "Club Owner",
    faction: "Nightlife",
    bio: "Runs some of the most exclusive events in the city.",
  },
  {
    name: "Kai Brooks",
    role: "Mechanic",
    faction: "LURP Customs",
    bio: "The person everyone calls when their build needs to stand out.",
  },
  {
    name: "Dylan Carter",
    role: "Security Lead",
    faction: "East End Security",
    bio: "Professional, reliable and always watching the room.",
  },
];

export const rewards = [
  {
    title: "Daily Check-in",
    description: "Open LURP Connect daily to earn community XP.",
    icon: Gift,
  },
  {
    title: "Verified Member",
    description: "Link your Discord and become a verified LURP member.",
    icon: BadgeCheck,
  },
  {
    title: "Event Supporter",
    description: "Attend community events and collect event badges.",
    icon: CalendarDays,
  },
  {
    title: "Media Creator",
    description: "Submit screenshots and clips to earn creator recognition.",
    icon: Camera,
  },
];