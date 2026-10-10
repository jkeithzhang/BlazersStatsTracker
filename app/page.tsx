"use client";

import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type Team = {
  name: string;
  logo: string;
  record?: string;
  differential?: string;
};

type Player = {
  name: string;
  number: number;
  group: "forward" | "defence" | "goalie";
  isGoalie?: boolean;
};

type SkaterGameStat = {
  position: string;
  number: string;
  player: string;
  shots: number;
  assists: number;
  goals: number;
  blockedShots: number;
  attended?: boolean;
};

type GoalieGameStat = {
  number: string;
  player: string;
  shotsAgainst: number;
  saves: number;
};

type SavedGame = {
  id: string; date: string; opponent: string; opponentLogo: string;
  teamScore: number; opponentScore: number; teamSog: number; opponentSog: number;
  skaters: SkaterGameStat[];
  goalies: GoalieGameStat[];
  confirmed?: boolean;
};

type GameDraft = {
  date: string;
  opponent: string;
  customOpponentName?: string;
  draft: SkaterGameStat[];
  goalieDraft: GoalieGameStat[];
  affiliateName: string;
};

const DRAFT_STORAGE_KEY = "blazers-new-game-draft-v1";
const PENDING_GAMES_STORAGE_KEY = "blazers-pending-games-v1";
const CUSTOM_OPPONENT_VALUE = "__custom_opponent__";

const teams: Team[] = [
  { name: "Ottawa Valley Silver Seven Black", logo: "/images/teams/ottawa-valley-silver-seven.png" },
  { name: "Rideau St. Lawrence Kings", logo: "/images/teams/rideau-st-lawrence-kings.png" },
  { name: "Ottawa Valley Silver Seven White", logo: "/images/teams/ottawa-valley-silver-seven.png" },
  { name: "Kanata Blazers", logo: "/images/teams/kanata-blazers.png" },
  { name: "Nepean Raiders", logo: "/images/teams/nepean-raiders.png" },
  { name: "Ottawa Sting", logo: "/images/teams/ottawa-sting.png", record: "0–1–0", differential: "−7" },
  { name: "Upper Ottawa Valley Aces", logo: "/images/teams/upper-ottawa-valley-aces.png" },
  { name: "Gloucester Rangers Green", logo: "/images/teams/gloucester-rangers.png" },
  { name: "Gloucester Rangers Gold", logo: "/images/teams/gloucester-rangers.png" },
  { name: "Eastern Ontario Cobras", logo: "/images/teams/eastern-ontario-cobras.png" },
  { name: "St. Lawrence Steel", logo: "/images/teams/st-lawrence-steel.png" },
  { name: "Cumberland Jr. Grads", logo: "/images/teams/cumberland-jr-grads.png" },
  { name: "Seaway Valley Rapids", logo: "/images/teams/seaway-valley-rapids.png" },
];

const roster: Player[] = [
  { name: "Brown", number: 18, group: "forward" },
  { name: "Devereaux", number: 11, group: "forward" },
  { name: "Chen", number: 26, group: "forward" },
  { name: "Goddard", number: 28, group: "forward" },
  { name: "Paquette", number: 7, group: "forward" },
  { name: "Rantala", number: 5, group: "forward" },
  { name: "Therien", number: 14, group: "forward" },
  { name: "Song", number: 3, group: "forward" },
  { name: "Zhang", number: 8, group: "forward" },
  { name: "An", number: 6, group: "defence" },
  { name: "Cleroux", number: 12, group: "defence" },
  { name: "Leahy", number: 2, group: "defence" },
  { name: "Robinson", number: 17, group: "defence" },
  { name: "Yun", number: 9, group: "defence" },
  { name: "Tabaczuk", number: 24, group: "defence" },
  { name: "Hignell", number: 31, group: "goalie", isGoalie: true },
  { name: "Rennick", number: 35, group: "goalie", isGoalie: true },
];

const createSkaterDraft = (): SkaterGameStat[] => roster
  .filter((player) => !player.isGoalie)
  .map((player) => ({
    position: "",
    number: String(player.number),
    player: player.name,
    shots: 0,
    assists: 0,
    goals: 0,
    blockedShots: 0,
    attended: true,
  }));

const positions = ["LW", "RW", "C", "LD", "RD"] as const;

const createGoalieDraft = (): GoalieGameStat[] => roster
  .filter((player) => player.isGoalie)
  .map((player) => ({ number: String(player.number), player: player.name, shotsAgainst: 0, saves: 0 }));

const savePercentage = (shotsAgainst: number, saves: number) => shotsAgainst
  ? (saves / shotsAgainst).toFixed(3).replace(/^0/, "")
  : "—";

const ottawaStingGame = {
  date: "Sep 11, 2026",
  opponent: "Ottawa Sting",
  opponentLogo: "/images/teams/ottawa-sting.png",
  result: "L 2–9",
  goals: 2,
  assists: 2,
  penalties: 0,
  shots: 16,
  opponentShots: 19,
  goalies: [
    { number: 31, player: "Gavin", shotsAgainst: 8, saves: 6, goalsAgainst: 2, savePercentage: ".750" },
    { number: 35, player: "Hunter", shotsAgainst: 11, saves: 4, goalsAgainst: 7, savePercentage: ".364" },
  ],
  skaters: [
    { position: "LW", number: "5", player: "Ollie", shots: 0, assists: 0, goals: 0, blockedShots: 1 },
    { position: "C", number: "14", player: "Max", shots: 1, assists: 0, goals: 0, blockedShots: 0 },
    { position: "RW", number: "26", player: "Dennis", shots: 0, assists: 0, goals: 0, blockedShots: 0 },
    { position: "LW", number: "8", player: "Jeremy", shots: 3, assists: 0, goals: 0, blockedShots: 2 },
    { position: "C", number: "28", player: "Liam", shots: 3, assists: 0, goals: 0, blockedShots: 0 },
    { position: "RW", number: "18", player: "Connor", shots: 2, assists: 0, goals: 0, blockedShots: 0 },
    { position: "LW", number: "7", player: "Brennan", shots: 2, assists: 1, goals: 0, blockedShots: 0 },
    { position: "C", number: "3", player: "Jeremiah", shots: 1, assists: 1, goals: 0, blockedShots: 0 },
    { position: "RW", number: "11", player: "Bernie", shots: 2, assists: 0, goals: 2, blockedShots: 0 },
    { position: "LW", number: "24", player: "Caleb", shots: 0, assists: 0, goals: 0, blockedShots: 0 },
    { position: "LD", number: "6", player: "Elena", shots: 0, assists: 0, goals: 0, blockedShots: 0 },
    { position: "RD", number: "17", player: "Tanner", shots: 0, assists: 0, goals: 0, blockedShots: 1 },
    { position: "LD", number: "11", player: "Wyatt", shots: 0, assists: 0, goals: 0, blockedShots: 1 },
    { position: "RD", number: "", player: "Brodie", shots: 0, assists: 0, goals: 0, blockedShots: 0 },
    { position: "LD", number: "9", player: "Hayden", shots: 2, assists: 0, goals: 0, blockedShots: 0 },
  ] satisfies SkaterGameStat[],
};

function TeamMark({ team }: { team: Team }) {
  return (
    <span className="team-mark" aria-hidden="true">
      <img src={team.logo} alt="" />
    </span>
  );
}

function RosterCard({ player }: { player: Player }) {
  return (
    <article className={`roster-card${player.isGoalie ? " goalie" : ""}`}>
      <span className="roster-number">{player.number}</span>
      <span className="roster-name">{player.name}</span>
      {player.isGoalie && <span className="position-label">Goalie</span>}
    </article>
  );
}

export default function Home() {
  const [view, setView] = useState<"clubs" | "rosters" | "newgame" | "history">("clubs");
  const [showGameDetail, setShowGameDetail] = useState(false);
  const [selectedSavedGame, setSelectedSavedGame] = useState<SavedGame | null>(null);
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
  const [opponent, setOpponent] = useState(teams[0].name);
  const [customOpponentName, setCustomOpponentName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [draft, setDraft] = useState<SkaterGameStat[]>(createSkaterDraft);
  const [goalieDraft, setGoalieDraft] = useState<GoalieGameStat[]>(createGoalieDraft);
  const [affiliateName, setAffiliateName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null);
  const [confirmingGameId, setConfirmingGameId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [pendingGamesReady, setPendingGamesReady] = useState(false);
  const [pendingGames, setPendingGames] = useState<SavedGame[]>([]);
  const [draftNotice, setDraftNotice] = useState("");
  const [syncingPendingGames, setSyncingPendingGames] = useState(false);
  const draggingPlayerIndex = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const restoreDeviceData = async () => {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const storedDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (storedDraft) {
          const restoredDraft = JSON.parse(storedDraft) as GameDraft;
          if (restoredDraft.date && restoredDraft.opponent && Array.isArray(restoredDraft.draft) && Array.isArray(restoredDraft.goalieDraft)) {
            setDate(restoredDraft.date);
            setOpponent(restoredDraft.opponent);
            setCustomOpponentName(restoredDraft.customOpponentName ?? "");
            setDraft(restoredDraft.draft);
            setGoalieDraft(restoredDraft.goalieDraft);
            setAffiliateName(restoredDraft.affiliateName ?? "");
            setDraftNotice("Your in-progress game is saved on this device.");
          }
        }
      } catch { window.localStorage.removeItem(DRAFT_STORAGE_KEY); }
      finally { setDraftReady(true); }

      try {
        const storedGames = window.localStorage.getItem(PENDING_GAMES_STORAGE_KEY);
        if (storedGames) setPendingGames(JSON.parse(storedGames) as SavedGame[]);
      } catch { window.localStorage.removeItem(PENDING_GAMES_STORAGE_KEY); }
      finally { setPendingGamesReady(true); }
    };
    void restoreDeviceData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    fetch("/api/games")
      .then((response) => response.ok ? response.json() : { games: [] })
      .then((data) => setSavedGames(data.games ?? []))
      .catch(() => setSaveError("Saved games could not be loaded. Connect to the internet to see your full history."));
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    try { window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ date, opponent, customOpponentName, draft, goalieDraft, affiliateName } satisfies GameDraft)); } catch { /* Browser storage is best-effort. */ }
  }, [affiliateName, customOpponentName, date, draft, draftReady, goalieDraft, opponent]);

  useEffect(() => {
    if (!pendingGamesReady) return;
    try { window.localStorage.setItem(PENDING_GAMES_STORAGE_KEY, JSON.stringify(pendingGames)); } catch { /* Browser storage is best-effort. */ }
  }, [pendingGames, pendingGamesReady]);
  const teamScore = useMemo(() => draft.reduce((total, skater) => total + skater.goals, 0), [draft]);
  const teamSog = useMemo(() => draft.reduce((total, skater) => total + skater.shots, 0), [draft]);
  const opponentScore = useMemo(() => goalieDraft.reduce((total, goalie) => total + goalie.shotsAgainst - goalie.saves, 0), [goalieDraft]);
  const opponentSog = useMemo(() => goalieDraft.reduce((total, goalie) => total + goalie.shotsAgainst, 0), [goalieDraft]);
  const updateStat = (index: number, key: keyof Pick<SkaterGameStat, "shots" | "assists" | "goals" | "blockedShots">, change: number) => setDraft((current) => current.map((skater, itemIndex) => itemIndex === index ? { ...skater, [key]: Math.max(0, skater[key] + change) } : skater));
  const updatePosition = (index: number, position: string) => setDraft((current) => current.map((skater, itemIndex) => itemIndex === index ? { ...skater, position } : skater));
  const setAttendance = (index: number, attended: boolean) => setDraft((current) => current.map((skater, itemIndex) => itemIndex === index ? {
    ...skater,
    attended,
    ...(attended ? {} : { shots: 0, assists: 0, goals: 0, blockedShots: 0 }),
  } : skater));
  const reorderPlayers = (fromIndex: number, toIndex: number) => setDraft((current) => {
    if (fromIndex === toIndex) return current;
    const next = [...current];
    const [player] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, player);
    return next;
  });
  const startPlayerDrag = (event: ReactPointerEvent<HTMLButtonElement>, index: number) => {
    event.preventDefault();
    draggingPlayerIndex.current = index;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const movePlayerDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const fromIndex = draggingPlayerIndex.current;
    if (fromIndex === null) return;
    const row = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLTableRowElement>("tr[data-skater-index]");
    const toIndex = Number(row?.dataset.skaterIndex);
    if (!Number.isInteger(toIndex) || toIndex === fromIndex) return;
    reorderPlayers(fromIndex, toIndex);
    draggingPlayerIndex.current = toIndex;
  };
  const stopPlayerDrag = () => { draggingPlayerIndex.current = null; };
  const updateGoalieStat = (index: number, key: "shotsAgainst" | "saves", change: number) => setGoalieDraft((current) => current.map((goalie, itemIndex) => {
    if (itemIndex !== index) return goalie;
    if (key === "shotsAgainst") {
      const shotsAgainst = Math.max(0, goalie.shotsAgainst + change);
      return { ...goalie, shotsAgainst, saves: Math.min(goalie.saves, shotsAgainst) };
    }
    return { ...goalie, saves: Math.max(0, Math.min(goalie.shotsAgainst, goalie.saves + change)) };
  }));
  const addAffiliate = () => {
    const name = affiliateName.trim().replace(/\s+/g, " ");
    if (!name) return;
    setDraft((current) => [...current, { position: "", number: "", player: `${name} (Affiliate)`, shots: 0, assists: 0, goals: 0, blockedShots: 0, attended: true }]);
    setAffiliateName("");
  };
  const resetDraft = () => {
    setDraft(createSkaterDraft());
    setGoalieDraft(createGoalieDraft());
    setAffiliateName("");
    setCustomOpponentName("");
    try { window.localStorage.removeItem(DRAFT_STORAGE_KEY); } catch { /* Browser storage is best-effort. */ }
  };
  const syncPendingGames = useCallback(async () => {
    if (!pendingGamesReady || !pendingGames.length || !navigator.onLine) return;
    setSyncingPendingGames(true);
    const syncedIds: string[] = [];
    const syncedGames: SavedGame[] = [];
    for (const game of pendingGames) {
      try {
        const response = await fetch("/api/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(game) });
        if (!response.ok) continue;
        syncedIds.push(game.id);
        syncedGames.push(game);
      } catch { break; }
    }
    if (syncedIds.length) {
      setPendingGames((current) => current.filter((game) => !syncedIds.includes(game.id)));
      setSavedGames((current) => [...syncedGames.filter((game) => !current.some((item) => item.id === game.id)), ...current]);
      setDraftNotice(syncedIds.length === 1 ? "1 queued game synced to your history." : `${syncedIds.length} queued games synced to your history.`);
    }
    setSyncingPendingGames(false);
  }, [pendingGames, pendingGamesReady]);

  useEffect(() => {
    const syncWhenOnline = () => { void syncPendingGames(); };
    window.addEventListener("online", syncWhenOnline);
    void Promise.resolve().then(syncPendingGames);
    return () => window.removeEventListener("online", syncWhenOnline);
  }, [syncPendingGames]);

  const submitGame = async () => {
    const isCustomOpponent = opponent === CUSTOM_OPPONENT_VALUE;
    const opponentName = isCustomOpponent ? customOpponentName.trim().replace(/\s+/g, " ") : opponent;
    if (!opponentName) {
      setSaveError("Enter a tournament team name before submitting.");
      return;
    }
    const team = teams.find((item) => item.name === opponentName);
    const game: SavedGame = { id: crypto.randomUUID(), date, opponent: opponentName, opponentLogo: isCustomOpponent ? "" : team?.logo ?? "", teamScore, opponentScore, teamSog, opponentSog, skaters: draft, goalies: goalieDraft, confirmed: false };
    setSaving(true); setSaveError("");
    try {
      if (!navigator.onLine) throw new Error("offline");
      const response = await fetch("/api/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(game) });
      if (!response.ok) throw new Error("save failed");
      setSavedGames((current) => [game, ...current]);
      setDraftNotice("Game saved to your history.");
    } catch {
      setPendingGames((current) => [game, ...current]);
      setDraftNotice("No signal? This game is safely saved on this device and will sync when you are online.");
    }
    resetDraft();
    setView("history");
    setSaving(false);
  };
  const deleteGame = async (game: SavedGame) => {
    if (!window.confirm(`Delete the ${game.opponent} game on ${game.date}? This cannot be undone.`)) return;
    if (pendingGames.some((item) => item.id === game.id)) {
      setPendingGames((current) => current.filter((item) => item.id !== game.id));
      setSelectedSavedGame((current) => current?.id === game.id ? null : current);
      return;
    }
    setDeletingGameId(game.id); setSaveError("");
    try {
      const response = await fetch(`/api/games?id=${encodeURIComponent(game.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      setSavedGames((current) => current.filter((item) => item.id !== game.id));
      setSelectedSavedGame((current) => current?.id === game.id ? null : current);
    } catch { setSaveError("The game was not deleted. Please try again."); }
    finally { setDeletingGameId(null); }
  };
  const confirmGame = async (game: SavedGame) => {
    if (!window.confirm(`Confirm the ${game.opponent} game on ${game.date}? This will make the record final and remove the Delete option.`)) return;
    if (pendingGames.some((item) => item.id === game.id)) {
      setPendingGames((current) => current.map((item) => item.id === game.id ? { ...item, confirmed: true } : item));
      setSelectedSavedGame((current) => current?.id === game.id ? { ...current, confirmed: true } : current);
      return;
    }
    setConfirmingGameId(game.id); setSaveError("");
    try {
      const response = await fetch("/api/games", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: game.id }) });
      if (!response.ok) throw new Error();
      setSavedGames((current) => current.map((item) => item.id === game.id ? { ...item, confirmed: true } : item));
      setSelectedSavedGame((current) => current?.id === game.id ? { ...current, confirmed: true } : current);
    } catch { setSaveError("The game could not be confirmed. Please try again when you are online."); }
    finally { setConfirmingGameId(null); }
  };
  const opponentRecord = (teamName: string) => {
    let wins = 0; let losses = 0; let ties = 0; let differential = 0; let played = 0;
    if (teamName === "Ottawa Sting") { losses = 1; differential = -7; played = 1; }
    [...pendingGames, ...savedGames].filter((game) => game.opponentLogo && game.opponent === teamName).forEach((game) => { played += 1; differential += game.teamScore - game.opponentScore; if (game.teamScore > game.opponentScore) wins += 1; else if (game.teamScore < game.opponentScore) losses += 1; else ties += 1; });
    return played ? { record: `${wins}–${losses}–${ties}`, differential: `${differential >= 0 ? "+" : "−"}${Math.abs(differential)}` } : null;
  };

  return (
    <main className="min-h-screen overflow-x-hidden">
      <header className="site-header">
        <button className="brand" onClick={() => setView("clubs")} aria-label="Open league clubs">
          <img className="brand-logo" src="/images/teams/kanata-blazers.png" alt="" aria-hidden="true" />
          <span className="brand-title">2026–2027 Season</span>
        </button>

        <nav aria-label="Primary navigation">
          <button className={view === "clubs" ? "active" : ""} onClick={() => setView("clubs")}>
            League clubs
          </button>
          <button className={view === "rosters" ? "active" : ""} onClick={() => setView("rosters")}>
            Rosters
          </button>
          <button className={view === "newgame" ? "active" : ""} onClick={() => setView("newgame")}>
            New game
          </button>
          <button className={view === "history" ? "active" : ""} onClick={() => setView("history")}>
            Game history
          </button>
        </nav>
      </header>

      {view === "clubs" ? (
        <section className="dashboard" aria-label="League team directory">
          <div className="team-grid">
            {teams.map((team) => {
              const record = opponentRecord(team.name);
              return <article className="team-card" key={team.name}>
                <TeamMark team={team} />
                <span className="club-copy">
                  <span className="club-name">{team.name}</span>
                  {record && (
                    <span className="club-record">
                      <span>Record {record.record}</span>
                      <span className="club-differential">+/− {record.differential}</span>
                    </span>
                  )}
                </span>
              </article>;
            })}
          </div>
        </section>
      ) : view === "rosters" ? (
        <section className="roster-view" aria-label="Kanata Blazers roster">
          <section className="roster-group" aria-labelledby="forwards-title">
            <h2 id="forwards-title">Forwards</h2>
            <div className="roster-grid">
              {roster.filter((player) => player.group === "forward").map((player) => <RosterCard key={player.number} player={player} />)}
            </div>
          </section>
          <section className="roster-group" aria-labelledby="defence-title">
            <h2 id="defence-title">Defence</h2>
            <div className="roster-grid defence-grid">
              {roster.filter((player) => player.group === "defence").map((player) => <RosterCard key={player.number} player={player} />)}
            </div>
          </section>
          <section className="roster-group" aria-labelledby="goalies-title">
            <h2 id="goalies-title">Goalies</h2>
            <div className="roster-grid goalie-grid">
              {roster.filter((player) => player.group === "goalie").map((player) => <RosterCard key={player.number} player={player} />)}
            </div>
          </section>
        </section>
      ) : view === "newgame" ? (
        <section className="new-game-view" aria-label="New game sheet">
          <div className="new-game-heading"><div><p className="eyebrow">Game entry</p><h1>New game</h1></div><span className="live-score">Blazers {teamScore} – {opponentScore} Opponent</span></div>
          <div className="game-setup">
            <label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
            <label>Opponent<select value={opponent} onChange={(event) => setOpponent(event.target.value)}>{teams.filter((team) => team.name !== "Kanata Blazers").map((team) => <option key={team.name}>{team.name}</option>)}<option value={CUSTOM_OPPONENT_VALUE}>Tournament / non-league team</option></select></label>
            {opponent === CUSTOM_OPPONENT_VALUE && <label className="custom-opponent-field">Tournament team name<input value={customOpponentName} onChange={(event) => setCustomOpponentName(event.target.value)} placeholder="Enter team name" /></label>}
            <label>Opponent goals<output className="calculated-score">{opponentScore}</output></label>
            <label>Opponent SOG<output className="calculated-score">{opponentSog}</output></label>
          </div>
          <div className="live-total">Team SOG: <strong>{teamSog}</strong> · Goals are calculated from the skater sheet. Opponent goals and SOG are calculated from goalie stats.</div>
          <p className="device-save-status" role="status"><span aria-hidden="true">●</span> {draftNotice || "Changes are automatically saved on this device."}</p>
          <div className="affiliate-entry"><label>Add affiliate player<input value={affiliateName} onChange={(event) => setAffiliateName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addAffiliate(); } }} placeholder="Player name" /></label><button type="button" onClick={addAffiliate} disabled={!affiliateName.trim()}>Add player</button></div>
          <p className="reorder-hint">Drag the handle beside a player to arrange your lines.</p>
          <div className="detail-table-wrap entry-table-wrap"><table className="detail-table entry-table"><thead><tr><th scope="col"><span className="sr-only">Reorder</span></th><th scope="col">Position</th><th scope="col">Player</th><th scope="col">G</th><th scope="col">A</th><th scope="col">SOG</th><th scope="col">BS</th><th scope="col"><span className="sr-only">Attendance</span></th></tr></thead><tbody>{draft.map((skater, index) => {
            const isAbsent = skater.attended === false;
            const isRegularRosterPlayer = Boolean(skater.number);
            return <tr key={`${skater.player}-${skater.number}-${index}`} data-skater-index={index} className={isAbsent ? "absent-player" : ""}><td className="drag-cell"><button type="button" className="drag-handle" disabled={isAbsent} aria-label={`Drag ${skater.player} to reorder`} onPointerDown={(event) => startPlayerDrag(event, index)} onPointerMove={movePlayerDrag} onPointerUp={stopPlayerDrag} onPointerCancel={stopPlayerDrag}>↕</button></td><td><select className="position-select" disabled={isAbsent} aria-label={`Position for ${skater.player}`} value={skater.position} onChange={(event) => updatePosition(index, event.target.value)}><option value="">—</option>{positions.map((position) => <option key={position} value={position}>{position}</option>)}</select></td><td>{skater.number ? `${skater.player} #${skater.number}` : skater.player}</td>{(["goals", "assists", "shots", "blockedShots"] as const).map((key) => <td key={key}><div className="stat-step"><button type="button" disabled={isAbsent} aria-label={`Decrease ${key} for ${skater.player}`} onClick={() => updateStat(index, key, -1)}>−</button><output>{skater[key]}</output><button type="button" disabled={isAbsent} aria-label={`Increase ${key} for ${skater.player}`} onClick={() => updateStat(index, key, 1)}>+</button></div></td>)}<td className="attendance-cell">{isRegularRosterPlayer && <button type="button" className="attendance-toggle" aria-label={isAbsent ? `Mark ${skater.player} as attending` : `Mark ${skater.player} as absent`} aria-pressed={!isAbsent} onClick={() => setAttendance(index, isAbsent)}>{isAbsent ? "+" : "−"}</button>}</td></tr>;
          })}</tbody></table></div>
          <fieldset className="new-game-goalies">
            <legend>Goalie stats</legend>
            <p>Enter shots against and saves. Goals against and save percentage are calculated automatically.</p>
            <div className="detail-table-wrap entry-table-wrap"><table className="detail-table entry-table"><thead><tr><th>Player</th><th>SA</th><th>SV</th><th>GA</th><th>SV%</th></tr></thead><tbody>{goalieDraft.map((goalie, index) => <tr key={goalie.number}><td>{goalie.player} #{goalie.number}</td>{(["shotsAgainst", "saves"] as const).map((key) => <td key={key}><div className="stat-step"><button type="button" aria-label={`Decrease ${key} for ${goalie.player}`} onClick={() => updateGoalieStat(index, key, -1)}>−</button><output>{goalie[key]}</output><button type="button" aria-label={`Increase ${key} for ${goalie.player}`} onClick={() => updateGoalieStat(index, key, 1)}>+</button></div></td>)}<td>{goalie.shotsAgainst - goalie.saves}</td><td>{savePercentage(goalie.shotsAgainst, goalie.saves)}</td></tr>)}</tbody></table></div>
          </fieldset>
          {saveError && <p className="save-error" role="alert">{saveError}</p>}
          <div className="game-actions"><button type="button" className="secondary-action" onClick={resetDraft}>Reset sheet</button><button type="button" className="submit-game" disabled={saving || (opponent === CUSTOM_OPPONENT_VALUE && !customOpponentName.trim())} onClick={submitGame}>{saving ? "Saving…" : "Submit game"}</button></div>
        </section>
      ) : (
        <section className="history-view" aria-label="Game history">
          <div className="history-table-wrap">
            <table className="history-table">
              <caption className="sr-only">Past game stats. Select a game to view its full game sheet.</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Opponent</th>
                  <th scope="col">Result</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {pendingGames.map((game) => (
                  <tr className="history-row pending-game" key={game.id} tabIndex={0} role="button" aria-label={`Open queued ${game.opponent} game details`} onClick={() => setSelectedSavedGame(game)} onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedSavedGame(game); } }}>
                    <td>{new Date(`${game.date}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td><span className="history-opponent">{game.opponentLogo && <img src={game.opponentLogo} alt="" />}{game.opponent}</span></td>
                    <td><span className={game.teamScore > game.opponentScore ? "result-win" : game.teamScore === game.opponentScore ? "result-tie" : "result-loss"}>{game.teamScore > game.opponentScore ? "W" : game.teamScore === game.opponentScore ? "T" : "L"} {game.teamScore}–{game.opponentScore}</span><span className="sync-label">Waiting to sync</span></td>
                    <td>{game.confirmed ? <span className="final-game">In the book</span> : <span className="history-actions"><button type="button" className="confirm-game" onClick={(event) => { event.stopPropagation(); confirmGame(game); }}>Confirm</button><button type="button" className="delete-game" onClick={(event) => { event.stopPropagation(); deleteGame(game); }}>Delete</button></span>}</td>
                  </tr>
                ))}
                {savedGames.map((game) => (
                  <tr className="history-row" key={game.id} tabIndex={0} role="button" aria-label={`Open ${game.opponent} game details`} onClick={() => setSelectedSavedGame(game)} onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedSavedGame(game); } }}>
                    <td>{new Date(`${game.date}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td><span className="history-opponent">{game.opponentLogo && <img src={game.opponentLogo} alt="" />}{game.opponent}</span></td>
                    <td><span className={game.teamScore > game.opponentScore ? "result-win" : game.teamScore === game.opponentScore ? "result-tie" : "result-loss"}>{game.teamScore > game.opponentScore ? "W" : game.teamScore === game.opponentScore ? "T" : "L"} {game.teamScore}–{game.opponentScore}</span></td>
                    <td>{game.confirmed ? <span className="final-game">In the book</span> : <span className="history-actions"><button type="button" className="confirm-game" disabled={confirmingGameId === game.id} onClick={(event) => { event.stopPropagation(); confirmGame(game); }}>{confirmingGameId === game.id ? "Confirming…" : "Confirm"}</button><button type="button" className="delete-game" disabled={deletingGameId === game.id} onClick={(event) => { event.stopPropagation(); deleteGame(game); }}>{deletingGameId === game.id ? "Deleting…" : "Delete"}</button></span>}</td>
                  </tr>
                ))}
                <tr
                  className="history-row"
                  tabIndex={0}
                  role="button"
                  aria-label="Open Ottawa Sting game details"
                  onClick={() => setShowGameDetail(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setShowGameDetail(true);
                    }
                  }}
                >
                  <td>{ottawaStingGame.date}</td>
                  <td>
                    <span className="history-opponent">
                      <img src={ottawaStingGame.opponentLogo} alt="" />
                      {ottawaStingGame.opponent}
                    </span>
                  </td>
                  <td><span className="result-loss">{ottawaStingGame.result}</span></td>
                  <td><span className="final-game">In the book</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {saveError && <p className="save-error" role="alert">{saveError}</p>}
          {(pendingGames.length > 0 || syncingPendingGames) && <p className="sync-status" role="status">{syncingPendingGames ? "Syncing saved games…" : `${pendingGames.length} game${pendingGames.length === 1 ? "" : "s"} saved on this device and waiting for an internet connection.`}</p>}

          {selectedSavedGame && (
            <section className="game-detail" aria-labelledby="saved-game-title">
              <div className="game-detail-heading"><h2 id="saved-game-title">{selectedSavedGame.opponent} game sheet</h2><button type="button" onClick={() => setSelectedSavedGame(null)}>Close</button></div>
              <div className="game-summary-fields"><label>Date<input readOnly value={selectedSavedGame.date} /></label><label>Opponent<input readOnly value={selectedSavedGame.opponent} /></label><label>Opponent SOG<input readOnly value={selectedSavedGame.opponentSog} /></label><label>Team SOG<input readOnly value={selectedSavedGame.teamSog} /></label></div>
              <fieldset><legend>Goalie stats</legend><p className="table-scroll-hint">Swipe sideways to see all columns.</p><div className="detail-table-wrap"><table className="detail-table"><thead><tr><th>#</th><th>Player</th><th>SA</th><th>SV</th><th>GA</th><th>SV%</th></tr></thead><tbody>{(selectedSavedGame.goalies ?? []).map((goalie) => <tr key={goalie.number}><td>{goalie.number}</td><td>{goalie.player}</td><td>{goalie.shotsAgainst}</td><td>{goalie.saves}</td><td>{goalie.shotsAgainst - goalie.saves}</td><td>{savePercentage(goalie.shotsAgainst, goalie.saves)}</td></tr>)}</tbody></table></div></fieldset>
              <fieldset><legend>Skater stats</legend><p className="table-scroll-hint">Swipe sideways to see all columns.</p><div className="detail-table-wrap"><table className="detail-table"><thead><tr><th>Position</th><th>Player</th><th>SOG</th><th>A</th><th>G</th><th>BS</th></tr></thead><tbody>{selectedSavedGame.skaters.map((skater, index) => <tr key={`${skater.player}-${skater.number}-${index}`} className={skater.attended === false ? "absent-player" : ""}><td>{skater.position || "—"}</td><td>{skater.number ? `${skater.player} #${skater.number}` : skater.player}</td><td>{skater.shots}</td><td>{skater.assists}</td><td>{skater.goals}</td><td>{skater.blockedShots}</td></tr>)}</tbody></table></div></fieldset>
            </section>
          )}

          {showGameDetail && (
            <section className="game-detail" aria-labelledby="game-detail-title">
              <div className="game-detail-heading">
                <h2 id="game-detail-title">Ottawa Sting game sheet</h2>
                <button type="button" onClick={() => setShowGameDetail(false)}>Close</button>
              </div>

              <form className="game-form">
                <div className="game-summary-fields">
                  <label>Date<input readOnly value={ottawaStingGame.date} /></label>
                  <label>Opponent<input readOnly value={ottawaStingGame.opponent} /></label>
                  <label>Opponent SOG<input readOnly value={ottawaStingGame.opponentShots} /></label>
                  <label>Team SOG<input readOnly value={ottawaStingGame.shots} /></label>
                </div>

                <fieldset>
                  <legend>Goalie stats</legend>
                  <p className="table-scroll-hint">Swipe sideways to see all columns.</p>
                  <div className="detail-table-wrap">
                    <table className="detail-table">
                      <thead><tr><th>#</th><th>Player</th><th>SA</th><th>SV</th><th>GA</th><th>SV%</th></tr></thead>
                      <tbody>{ottawaStingGame.goalies.map((goalie) => (
                        <tr key={goalie.number}><td>{goalie.number}</td><td>{goalie.player}</td><td>{goalie.shotsAgainst}</td><td>{goalie.saves}</td><td>{goalie.goalsAgainst}</td><td>{goalie.savePercentage}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Skater stats</legend>
                  <p className="table-scroll-hint">Swipe sideways to see all columns.</p>
                  <div className="detail-table-wrap">
                    <table className="detail-table">
                      <thead><tr><th>Group</th><th>Player</th><th>SOG</th><th>A</th><th>G</th><th>BS</th></tr></thead>
                      <tbody>{ottawaStingGame.skaters.map((skater, index) => (
                        <tr key={`${skater.player}-${index}`}><td>{skater.position}</td><td>{skater.number ? `${skater.player} #${skater.number}` : skater.player}</td><td>{skater.shots}</td><td>{skater.assists}</td><td>{skater.goals}</td><td>{skater.blockedShots}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                </fieldset>
              </form>
            </section>
          )}
        </section>
      )}

      <footer className="site-footer">
        <span>Kanata Blazers Stats Tracker</span>
        <span>{pendingGames.length ? `${pendingGames.length} game${pendingGames.length === 1 ? "" : "s"} waiting to sync` : "New season · 1 game logged"}</span>
      </footer>
    </main>
  );
}
