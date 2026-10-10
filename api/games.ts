import { createClient } from "@libsql/client";

type SavedGame = {
  id: string;
  date: string;
  opponent: string;
  opponentLogo: string;
  teamScore: number;
  opponentScore: number;
  teamSog: number;
  opponentSog: number;
  skaters: unknown[];
  goalies: unknown[];
  confirmed?: boolean;
};

type ApiRequest = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => unknown;
};

function database() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) throw new Error("Database connection is unavailable.");
  return createClient({ url, authToken });
}

async function ensureSchema() {
  const db = database();
  await db.execute(`CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    game_date TEXT NOT NULL,
    opponent TEXT NOT NULL,
    opponent_logo TEXT NOT NULL,
    team_score INTEGER NOT NULL,
    opponent_score INTEGER NOT NULL,
    team_sog INTEGER NOT NULL,
    opponent_sog INTEGER NOT NULL,
    skaters_json TEXT NOT NULL,
    goalies_json TEXT NOT NULL DEFAULT '[]',
    confirmed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`);
  const columns = await db.execute("PRAGMA table_info(games)");
  if (!columns.rows.some((column) => String(column.name) === "goalies_json")) {
    await db.execute("ALTER TABLE games ADD COLUMN goalies_json TEXT NOT NULL DEFAULT '[]'");
  }
  if (!columns.rows.some((column) => String(column.name) === "confirmed")) {
    await db.execute("ALTER TABLE games ADD COLUMN confirmed INTEGER NOT NULL DEFAULT 0");
  }
  await db.execute("CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date DESC)");
  return db;
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  try {
    const db = await ensureSchema();
    if (request.method === "GET") {
      const result = await db.execute("SELECT * FROM games ORDER BY game_date DESC, created_at DESC");
      const games = result.rows.map((row) => ({
        id: row.id, date: row.game_date, opponent: row.opponent, opponentLogo: row.opponent_logo,
        teamScore: row.team_score, opponentScore: row.opponent_score, teamSog: row.team_sog,
        opponentSog: row.opponent_sog, skaters: JSON.parse(String(row.skaters_json)),
        goalies: JSON.parse(String(row.goalies_json ?? "[]")), confirmed: Boolean(row.confirmed),
      }));
      return response.status(200).json({ games });
    }
    if (request.method === "PATCH") {
      const game = request.body as Pick<SavedGame, "id">;
      if (!game?.id) return response.status(400).json({ error: "Game id is required" });
      await db.execute({ sql: "UPDATE games SET confirmed = 1 WHERE id = ?", args: [game.id] });
      return response.status(200).json({ confirmed: game.id });
    }
    if (request.method === "DELETE") {
      const id = String(request.query?.id ?? "");
      if (!id) return response.status(400).json({ error: "Game id is required" });
      const deleted = await db.execute({ sql: "DELETE FROM games WHERE id = ? AND confirmed = 0", args: [id] });
      if (!deleted.rowsAffected) return response.status(409).json({ error: "Confirmed games cannot be deleted" });
      return response.status(200).json({ deleted: id });
    }
    if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
    const game = request.body as SavedGame;
    if (!game?.id || !game.opponent || !Array.isArray(game.skaters)) return response.status(400).json({ error: "Invalid game" });
    await db.execute({
      sql: "INSERT INTO games (id, game_date, opponent, opponent_logo, team_score, opponent_score, team_sog, opponent_sog, skaters_json, goalies_json, confirmed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [game.id, game.date, game.opponent, game.opponentLogo, game.teamScore, game.opponentScore, game.teamSog, game.opponentSog, JSON.stringify(game.skaters), JSON.stringify(Array.isArray(game.goalies) ? game.goalies : []), game.confirmed ? 1 : 0, new Date().toISOString()],
    });
    return response.status(201).json({ game });
  } catch (error) {
    console.error("games API failed", error);
    return response.status(500).json({ error: "Unable to save game" });
  }
}
