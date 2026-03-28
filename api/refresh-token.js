import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const { data } = await supabase
      .from("soul_store")
      .select("value")
      .eq("key", "threads_token")
      .single();

    const token = data?.value || process.env.THREADS_ACCESS_TOKEN;

    const r = await fetch(
      `https://graph.threads.net/access_token?grant_type=th_refresh_token&access_token=${token}`
    );
    const d = await r.json();

    if (!d.access_token) {
      return res.status(500).json({ error: "Refresh failed", raw: d });
    }

    await supabase.from("soul_store").upsert({
      key: "threads_token",
      value: d.access_token,
    });

    return res.status(200).json({ success: true, expires_in: d.expires_in });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
