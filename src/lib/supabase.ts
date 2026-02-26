import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;
let _browser: SupabaseClient | null = null;

function getAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _admin;
}

function getBrowser(): SupabaseClient {
  if (!_browser) {
    _browser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _browser;
}

// Server-side client with service role (full access, used in API routes)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop: string) {
    const client = getAdmin();
    const value = (client as unknown as Record<string, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

// Browser-side client with anon key (read-only, used in React components)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseBrowser = new Proxy({} as SupabaseClient, {
  get(_, prop: string) {
    const client = getBrowser();
    const value = (client as unknown as Record<string, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
