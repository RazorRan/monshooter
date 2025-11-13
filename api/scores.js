// api/scores.js

let scores = []; // in-memory global leaderboard: [{name, score, ts}]

export default async function handler(req, res) {
  // Simple CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "GET") {
    const limit = Number(req.query.limit || 10);
    const sorted = [...scores].sort(
      (a, b) => b.score - a.score || a.ts - b.ts
    );
    res.status(200).json(sorted.slice(0, limit));
    return;
  }

  if (req.method === "POST") {
    try {
      const body = await getRawBody(req);
      const data = JSON.parse(body || "{}");
      const name = String(data.name || "Anonymous").slice(0, 24);
      const score = Number(data.score) || 0;

      // 🔥 NEW LOGIC: one entry per exact name (case-sensitive)
      const now = Date.now();
      const existing = scores.find((s) => s.name === name); // case-sensitive

      if (existing) {
        // keep the BEST score; only update if new is higher
        if (score > existing.score) {
          existing.score = score;
          existing.ts = now; // update timestamp so newer high score wins ties
        }
      } else {
        scores.push({ name, score, ts: now });
      }

      res.status(201).json({ ok: true });
    } catch (err) {
      console.error("Error in POST /api/scores:", err);
      res.status(400).json({ error: "Invalid request" });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

// Helper to read body (Vercel Node serverless pattern)
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}
