const express = require("express");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.VOLLEYBALL_API_KEY || "";
const API_BASE = "https://live-volleyball-api.com/api/v1";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const cache = new Map();
const CACHE_MS = 60 * 1000;

function cacheKey(url) {
  return url;
}

async function apiGet(endpoint, params = {}, ttl = CACHE_MS) {
  if (!API_KEY) {
    const err = new Error("API_KEY_MISSING");
    err.status = 503;
    throw err;
  }

  const url = new URL(API_BASE + endpoint);
  url.searchParams.set("api_key", API_KEY);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const key = cacheKey(url.toString());
  const cached = cache.get(key);
  if (cached && Date.now() - cached.time < ttl) return cached.data;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data.success === false) {
    const err = new Error(data.message || `API error ${response.status}`);
    err.status = response.status;
    throw err;
  }

  cache.set(key, { time: Date.now(), data });
  return data;
}

function unwrapMatches(payload) {
  return payload?.data?.matches || payload?.matches || [];
}

function normalizeMatch(m) {
  const status = typeof m.status === "string"
    ? m.status
    : (m.status?.status || "scheduled");

  return {
    id: m.id,
    league: m.league?.name || m.competition?.name || m.tournament?.name || "Волейбол",
    dateTime: m.date_time || m.start_time || m.dateTime || null,
    status,
    statusText: m.status?.display || status,
    home: {
      id: m.home?.id,
      name: m.home?.name || "Команда 1",
      logo: m.home?.logo || "",
      sets: m.home?.sets ?? 0,
      points: m.current_set_points?.home ?? m.home?.points ?? 0
    },
    away: {
      id: m.away?.id,
      name: m.away?.name || "Команда 2",
      logo: m.away?.logo || "",
      sets: m.away?.sets ?? 0,
      points: m.current_set_points?.away ?? m.away?.points ?? 0
    },
    venue: m.venue?.name || m.hall?.name || "",
    raw: m
  };
}

function realPlayerFallback() {
  return [
    { name: "Alessandro Michieletto", position: "Доигровщик", number: 5, team: "Италия", note: "Реальный игрок; точная клубная информация берётся из API." },
    { name: "Simone Giannelli", position: "Связующий", number: 6, team: "Италия", note: "Реальный игрок; точная клубная информация берётся из API." },
    { name: "Wilfredo León", position: "Доигровщик", number: 9, team: "Польша", note: "Реальный игрок; точная клубная информация берётся из API." },
    { name: "Earvin N'Gapeth", position: "Доигровщик", number: 9, team: "Франция", note: "Реальный игрок; точная клубная информация берётся из API." },
    { name: "Bartosz Kurek", position: "Диагональный", number: 6, team: "Польша", note: "Реальный игрок; точная клубная информация берётся из API." },
    { name: "Yuji Nishida", position: "Диагональный", number: 1, team: "Япония", note: "Реальный игрок; точная клубная информация берётся из API." }
  ];
}

app.get("/api/status", (req, res) => {
  res.json({
    configured: Boolean(API_KEY),
    message: API_KEY ? "API подключён" : "Добавь VOLLEYBALL_API_KEY в .env"
  });
});

app.get("/api/matches", async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const payload = await apiGet("/matches", { date, lang: "en" }, 30 * 1000);
    res.json({
      success: true,
      date,
      matches: unwrapMatches(payload).map(normalizeMatch),
      timestamp: payload.timestamp || new Date().toISOString()
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message === "API_KEY_MISSING"
        ? "API-ключ не настроен. Заполни файл .env."
        : err.message
    });
  }
});

app.get("/api/live", async (req, res) => {
  try {
    const date = new Date().toISOString().slice(0, 10);
    const payload = await apiGet("/matches", { date, lang: "en" }, 20 * 1000);
    const live = unwrapMatches(payload)
      .map(normalizeMatch)
      .filter(m => ["live", "inprogress", "in_progress", "started"].includes(String(m.status).toLowerCase()));

    res.json({ success: true, matches: live, timestamp: payload.timestamp || new Date().toISOString() });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message === "API_KEY_MISSING"
        ? "API-ключ не настроен. Заполни файл .env."
        : err.message
    });
  }
});

app.get("/api/live/:id", async (req, res) => {
  try {
    const payload = await apiGet("/live_match_details", {
      match_id: req.params.id,
      lang: "en"
    }, 20 * 1000);

    res.json({ success: true, data: payload.data || payload });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message
    });
  }
});

app.get("/api/search/player", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    if (!query) return res.json({ success: true, players: realPlayerFallback() });

    const payload = await apiGet("/player_search", { query, lang: "en" }, 10 * 60 * 1000);
    const players = payload?.data?.players || payload?.players || [];
    res.json({ success: true, players });
  } catch (err) {
    res.json({ success: true, players: realPlayerFallback(), fallback: true });
  }
});

app.get("/api/player/:id", async (req, res) => {
  try {
    const payload = await apiGet("/player", { player_id: req.params.id, lang: "en" }, 10 * 60 * 1000);
    res.json({ success: true, player: payload.data || payload });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
});

app.get("/api/players", async (req, res) => {
  // The API requires player_id for a detailed profile, so the page starts
  // with known real players and can search any additional player through /api/search/player.
  res.json({ success: true, players: realPlayerFallback() });
});

app.get("/api/stream/:id", async (req, res) => {
  try {
    const payload = await apiGet("/live_match_details", {
      match_id: req.params.id,
      lang: "en"
    }, 60 * 1000);

    const d = payload.data || payload;
    const candidates = [
      d.stream_url,
      d.streaming_url,
      d.video_url,
      d.live_url,
      d.broadcast_url,
      d.tv_url
    ].filter(Boolean);

    res.json({
      success: true,
      streamUrl: candidates[0] || null,
      data: d
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
});

app.get("*splat", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Volleyball site: http://localhost:${PORT}`);
  if (!API_KEY) {
    console.log("API key is not configured. Copy .env.example to .env and add your key.");
  }
});
