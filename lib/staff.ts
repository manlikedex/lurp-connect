import { supabase } from "@/lib/supabase";

export type StaffRole =
  | "support"
  | "staff"
  | "moderator"
  | "admin"
  | "god"
  | "owner";

export type StaffMember = {
  profile_id: string;
  role: StaffRole;
  active: boolean;
};

const validStaffRoles: StaffRole[] = [
  "support",
  "staff",
  "moderator",
  "admin",
  "god",
  "owner",
];

const supportRoutes = ["/staff", "/staff/tickets"];

const regularStaffRoutes = [
  "/staff",
  "/staff/tickets",
  "/staff/whitelist",
  "/staff/events",
  "/staff/businesses",
];

const moderatorBlockedRoutes = [
  "/staff/cms",
  "/staff/settings",
  "/staff/manage-staff",
  "/staff/developer",
];

function routeMatches(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isValidStaffRole(value: unknown): value is StaffRole {
  return (
    typeof value === "string" &&
    validStaffRoles.includes(value as StaffRole)
  );
}

export async function getCurrentStaffMember(): Promise<StaffMember | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error(
      "Current staff auth error:",
      JSON.stringify(userError, null, 2)
    );
    return null;
  }

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("staff_members")
    .select("profile_id, role, active")
    .eq("profile_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.error(
      "Staff member check error:",
      JSON.stringify(error, null, 2)
    );
    return null;
  }

  if (!data || !isValidStaffRole(data.role)) {
    return null;
  }

  return {
    profile_id: data.profile_id,
    role: data.role,
    active: Boolean(data.active),
  };
}

export async function getCurrentStaffRole(): Promise<StaffRole | null> {
  const staffMember = await getCurrentStaffMember();
  return staffMember?.role || null;
}

export async function isCurrentUserStaff(): Promise<boolean> {
  const staffMember = await getCurrentStaffMember();
  return Boolean(staffMember?.active);
}

export async function isCurrentUserSupport(): Promise<boolean> {
  const role = await getCurrentStaffRole();
  return role === "support";
}

export async function isCurrentUserModerator(): Promise<boolean> {
  const role = await getCurrentStaffRole();

  return (
    role === "moderator" ||
    role === "admin" ||
    role === "god" ||
    role === "owner"
  );
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const role = await getCurrentStaffRole();

  return role === "admin" || role === "god" || role === "owner";
}

export async function isCurrentUserGod(): Promise<boolean> {
  const role = await getCurrentStaffRole();

  return role === "god" || role === "owner";
}

export async function isCurrentUserOwner(): Promise<boolean> {
  const role = await getCurrentStaffRole();
  return role === "owner";
}

export function canRoleManageTickets(role: StaffRole | null): boolean {
  return Boolean(role);
}

export function canRoleManageWhitelist(role: StaffRole | null): boolean {
  return (
    role === "staff" ||
    role === "moderator" ||
    role === "admin" ||
    role === "god" ||
    role === "owner"
  );
}

export function canRoleManageMembers(role: StaffRole | null): boolean {
  return (
    role === "moderator" ||
    role === "admin" ||
    role === "god" ||
    role === "owner"
  );
}

export function canRoleManageCMS(role: StaffRole | null): boolean {
  return role === "admin" || role === "god" || role === "owner";
}

export function canRoleManageEvents(role: StaffRole | null): boolean {
  return (
    role === "staff" ||
    role === "moderator" ||
    role === "admin" ||
    role === "god" ||
    role === "owner"
  );
}

export function canRoleManageBusinesses(role: StaffRole | null): boolean {
  return (
    role === "staff" ||
    role === "moderator" ||
    role === "admin" ||
    role === "god" ||
    role === "owner"
  );
}

export function canRoleManageStaff(role: StaffRole | null): boolean {
  return role === "admin" || role === "god" || role === "owner";
}

export function canRoleAccessDeveloperTools(
  role: StaffRole | null
): boolean {
  return role === "god" || role === "owner";
}

export function canRoleAccessStaffRoute(
  role: StaffRole | null,
  pathname: string
): boolean {
  if (!role) {
    return false;
  }

  if (role === "owner" || role === "god" || role === "admin") {
    return true;
  }

  if (role === "support") {
    return supportRoutes.some((route) => routeMatches(pathname, route));
  }

  if (role === "moderator") {
    return !moderatorBlockedRoutes.some((route) =>
      routeMatches(pathname, route)
    );
  }

  if (role === "staff") {
    return regularStaffRoutes.some((route) =>
      routeMatches(pathname, route)
    );
  }

  return false;
}

export function getStaffHomeRoute(role: StaffRole | null): string {
  if (role === "support") {
    return "/staff/tickets";
  }

  return "/staff";
}

export function getStaffRoleLabel(role: StaffRole | null): string {
  switch (role) {
    case "support":
      return "Support";
    case "staff":
      return "Staff";
    case "moderator":
      return "Moderator";
    case "admin":
      return "Admin";
    case "god":
      return "God";
    case "owner":
      return "Owner";
    default:
      return "Member";
  }
}

export function getStaffRolePriority(role: StaffRole | null): number {
  switch (role) {
    case "owner":
      return 6;
    case "god":
      return 5;
    case "admin":
      return 4;
    case "moderator":
      return 3;
    case "staff":
      return 2;
    case "support":
      return 1;
    default:
      return 0;
  }
}

export function hasEqualOrHigherRole(
  currentRole: StaffRole | null,
  requiredRole: StaffRole
): boolean {
  return (
    getStaffRolePriority(currentRole) >=
    getStaffRolePriority(requiredRole)
  );
}