import { createClient } from "@/lib/supabase/server";

export async function requireOwner() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, isOwner: false };

  const { data, error } = await supabase.schema("research").rpc("am_i_owner");
  if (error) return { user, isOwner: false };

  return { user, isOwner: data === true };
}
