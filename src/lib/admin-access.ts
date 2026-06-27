import { supabase } from "@/integrations/supabase/client";

const ADMIN_ROLE_QUERY = 'supabase.from("user_roles").select("role").eq("user_id", user.id)';

export type AdminAccessResult = {
  isAdmin: boolean;
  userId: string | null;
  email: string;
  roles: string[];
  query: string;
  reason: string;
  queryError: string | null;
};

export async function checkAdminAccess({ refreshSession = false } = {}): Promise<AdminAccessResult> {
  if (refreshSession) {
    const { error: refreshError } = await supabase.auth.refreshSession();
    console.log("[Admin auth] session refresh", { ok: !refreshError, error: refreshError?.message ?? null });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;

  console.log("[Admin auth] authenticated user ID", user?.id ?? null);
  console.log("[Admin auth] authenticated email", user?.email ?? null);

  if (userError || !user) {
    const reason = userError?.message ?? "No authenticated user was found in the current session.";
    console.log("[Admin auth] admin query result", null);
    console.log("[Admin auth] role returned", []);
    console.log("[Admin auth] final authorization decision", false, reason);
    return {
      isAdmin: false,
      userId: null,
      email: "",
      roles: [],
      query: ADMIN_ROLE_QUERY,
      reason,
      queryError: userError?.message ?? null,
    };
  }

  const { data: roleRows, error: roleError, status } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roles = (roleRows ?? []).map((row) => row.role);
  const isAdmin = roles.includes("admin");
  const reason = roleError
    ? `Admin role lookup failed: ${roleError.message}`
    : isAdmin
      ? "Authorized: this user's UUID has an admin role in user_roles."
      : roles.length > 0
        ? `Not authorized: role returned ${roles.join(", ")}, but admin is required.`
        : "Not authorized: no role row exists in user_roles for this user's UUID.";

  console.log("[Admin auth] admin query", ADMIN_ROLE_QUERY);
  console.log("[Admin auth] admin query result", { data: roleRows, error: roleError, status });
  console.log("[Admin auth] role returned", roles);
  console.log("[Admin auth] final authorization decision", isAdmin, reason);

  return {
    isAdmin,
    userId: user.id,
    email: user.email ?? "",
    roles,
    query: ADMIN_ROLE_QUERY,
    reason,
    queryError: roleError?.message ?? null,
  };
}