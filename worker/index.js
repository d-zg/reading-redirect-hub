const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/set") {
      const targetUrl = url.searchParams.get("url");
      const title = url.searchParams.get("title") || "";
      const note = url.searchParams.get("note") || "";
      if (!targetUrl) {
        return json({ error: "missing url param" }, 400);
      }
      const item = { url: targetUrl, title, note, ts: new Date().toISOString() };
      await env.STORE.put("current", JSON.stringify(item));

      // Append to history
      const rawHistory = await env.STORE.get("history");
      const history = rawHistory ? JSON.parse(rawHistory) : [];
      history.unshift(item);
      // Keep last 200 entries
      if (history.length > 200) history.length = 200;
      await env.STORE.put("history", JSON.stringify(history));

      return json({ ok: true, current: item });
    }

    if (path === "/current") {
      const raw = await env.STORE.get("current");
      if (!raw) return json({ current: null });
      return json({ current: JSON.parse(raw) });
    }

    if (path === "/history") {
      const raw = await env.STORE.get("history");
      if (!raw) return json({ history: [] });
      return json({ history: JSON.parse(raw) });
    }

    return json({ error: "not found" }, 404);
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}
