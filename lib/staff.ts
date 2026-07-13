import { supabase } from "@/lib/supabase";

export type StaffRole =
  | "support"
  | "staff"
  | "moderator"
  | "admin"
  | "god";

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
];

const supportRoutes = ["/staff", "/staff/tickets"];

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

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("staff_members")
    .select("profile_id, role, active")
    .eq("profile_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (error || !data || !isValidStaffRole(data.role)) {
    if (error) {
      console.error(
        "Staff member check error:",
        JSON.stringify(error, null, 2)
      );
    }

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

export async function isCurrentUserAdmin(): Promise<boolean> {
  const role = await getCurrentStaffRole();

  return role === "admin" || role === "god";
}

export async function isCurrentUserGod(): Promise<boolean> {
  const role = await getCurrentStaffRole();
  return role === "god";
}

export function canRoleManageTickets(role: StaffRole | null): boolean {
  return Boolean(role);
}

export function canRoleManageWhitelist(role: StaffRole | null): boolean {
  return (
    role === "staff" ||
    role === "moderator" ||
    role === "admin" ||
    role === "god"
  );
}

export function canRoleManageMembers(role: StaffRole | null): boolean {
  return (
    role === "moderator" ||
    role === "admin" ||
    role === "god"
  );
}

export function canRoleManageCMS(role: StaffRole | null): boolean {
  return role === "admin" || role === "god";
}

export function canRoleManageEvents(role: StaffRole | null): boolean {
  return (
    role === "staff" ||
    role === "moderator" ||
    role === "admin" ||
    role === "god"
  );
}

export function canRoleManageStaff(role: StaffRole | null): boolean {
  return role === "admin" || role === "god";
}

export function canRoleAccessStaffRoute(
  role: StaffRole | null,
  pathname: string
): boolean {
  if (!role) {
    return false;
  }

  if (role === "god" || role === "admin") {
    return true;
  }

  if (role === "support") {
    return supportRoutes.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(`${route}/`)
    );
  }

  if (role === "moderator") {
    const blockedRoutes = [
      "/staff/cms",
      "/staff/settings",
      "/staff/manage-staff",
      "/staff/developer",
    ];

    return !blockedRoutes.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(`${route}/`)
    );
  }

  if (role === "staff") {
    const allowedRoutes = [
      "/staff",
      "/staff/tickets",
      "/staff/whitelist",
      "/staff/events",
      "/staff/businesses",
    ];

    return allowedRoutes.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(`${route}/`)
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