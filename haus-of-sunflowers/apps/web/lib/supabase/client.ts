import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

/**
 * Reuse one browser client so only one auth client is responsible for
 * refreshing and persisting the signed-in session in this tab.
 */
export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );
  }

  return browserClient;
}
