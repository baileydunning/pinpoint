import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Target, Flame, ArrowLeft, Clock, Lock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getDailyResults,
  getDailyStreak,
  getTodayDateString,
  getTimeUntilNextPuzzle,
  DailyResult,
  hasDailyBeenPlayed,
} from '@/lib/dailyPuzzle';
import { useEffect, useMemo, useState } from 'react';

type HighScoreRow = {
  id: string;
  date: string;

  playerName: string;

  distanceKm: number | string;
  zoomLevel: number | string;

  guessLat: number | string;
  guessLng: number | string;
  actualLat: number | string;
  actualLng: number | string;

  country?: string | null;

  actualDisplayName?: string | null;
  actualState?: string | null;

  guessCountry?: string | null;
  guessState?: string | null;
  guessCity?: string | null;
  guessDisplayName?: string | null;
};

export async function postHighScore(result: DailyResult): Promise<HighScoreRow> {
  const payload: Partial<HighScoreRow> & { id: string; date: string; playerName: string } = {
    id: `${result.date}-${result.playerName}-${result.distanceKm}`,
    date: result.date,
    playerName: result.playerName,
    distanceKm: result.distanceKm,
    zoomLevel: result.zoomLevel,
    guessLat: result.guessLat,
    guessLng: result.guessLng,
    actualLat: result.actualLat,
    actualLng: result.actualLng,
    country: result.country ?? null,
    actualDisplayName: (result as any).actualDisplayName ?? null,
    actualState: (result as any).actualState ?? null,
    guessCountry: (result as any).guessCountry ?? null,
    guessState: (result as any).guessState ?? null,
    guessCity: (result as any).guessCity ?? null,
    guessDisplayName: (result as any).guessDisplayName ?? null,
  };

  const res = await fetch('/HighScores/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`POST /HighScores failed (${res.status}) ${text}`);
  }

  const data = await res.json().catch(() => null);
  const row =
    data && typeof data === 'object' && 'body' in (data as any) ? (data as any).body : data;

  return row as HighScoreRow;
}

function normalizeToIsoDate(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;

  const m = date.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) {
    const [, mm, dd, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }

  const d = new Date(date);
  if (!Number.isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  return date;
}

function timeoutAfter(ms: number, label: string) {
  return new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(label));
    }, ms);
  });
}

function toNumber(v: number | string): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

async function fetchAllHighScores(): Promise<HighScoreRow[]> {
  const url = '/HighScores/';

  const res = (await Promise.race([
    fetch(url, { method: 'GET', headers: { Accept: 'application/json' } }),
    timeoutAfter(10_000, `Leaderboard fetch timed out after 10s (${url})`),
  ])) as Response;

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET ${url} failed (${res.status}) ${text}`);
  }

  const data = await res.json();

  const rowsRaw = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.body)
      ? (data as any).body
      : [];

  const rows = (rowsRaw as any[]).filter((r) => r && typeof r === 'object') as HighScoreRow[];

  return rows.map((r) => ({
    ...r,
    date: normalizeToIsoDate(String(r.date)),
    distanceKm: toNumber(r.distanceKm),
    zoomLevel: toNumber(r.zoomLevel),
    guessLat: toNumber(r.guessLat),
    guessLng: toNumber(r.guessLng),
    actualLat: toNumber(r.actualLat),
    actualLng: toNumber(r.actualLng),
    country: r.country ?? null,
    actualDisplayName: r.actualDisplayName ?? null,
    actualState: r.actualState ?? null,
    guessCountry: r.guessCountry ?? null,
    guessState: r.guessState ?? null,
    guessCity: r.guessCity ?? null,
    guessDisplayName: r.guessDisplayName ?? null,
  }));
}

const HighScores = () => {
  const [countdown, setCountdown] = useState(getTimeUntilNextPuzzle());
  const dailyResults = getDailyResults();
  const streak = getDailyStreak();
  const hasPlayedToday = hasDailyBeenPlayed();
  const today = getTodayDateString();

  const [allScores, setAllScores] = useState<HighScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userResultsByDate = useMemo(() => {
    return dailyResults.reduce((acc, result) => {
      acc[normalizeToIsoDate(result.date)] = result;
      return acc;
    }, {} as Record<string, DailyResult>);
  }, [dailyResults]);

  const hasPlayedDate = (date: string) => userResultsByDate[normalizeToIsoDate(date)] !== undefined;

  const leaderboardsByDate = useMemo(() => {
    const map: Record<string, HighScoreRow[]> = {};
    for (const row of allScores) {
      const d = normalizeToIsoDate(String(row.date));
      if (!map[d]) map[d] = [];
      map[d].push(row);
    }
    for (const d of Object.keys(map)) {
      map[d] = map[d].slice().sort((a, b) => toNumber(a.distanceKm) - toNumber(b.distanceKm));
    }
    return map;
  }, [allScores]);

  // Only show one card for the local user's today, merging backend and local logic
  const allDates = useMemo(() => {
    const isoToday = normalizeToIsoDate(today);
    // Map all backend dates to ISO and deduplicate, but always treat isoToday as the canonical key
    const dateSet = new Set<string>();
    let hasToday = false;
    for (const s of allScores) {
      const d = normalizeToIsoDate(String(s.date));
      if (d === isoToday) {
        hasToday = true;
      }
      dateSet.add(d);
    }
    // Remove any duplicate of today
    dateSet.delete(isoToday);
    // Only show 'Today' if there are scores for today or the user has played today
    const userPlayedToday = hasPlayedDate(isoToday);
    const dates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));
    if (hasToday || userPlayedToday) {
      dates.unshift(isoToday);
    }
    return dates;
  }, [allScores, today]);

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getTimeUntilNextPuzzle()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchAllHighScores();
        if (!alive) return;
        setAllScores(rows);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Failed to load leaderboard');
        setAllScores([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const formatDistance = (km: number) => {
    if (!Number.isFinite(km)) return '—';
    if (km < 1) return `${Math.round(km * 1000)} m`;
    if (km < 10) return `${km.toFixed(1)} km`;
    return `${Math.round(km).toLocaleString()} km`;
  };

  const formatCountdown = () => {
    const { hours, minutes, seconds } = countdown;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Always show 'Today' for the local user's current date, regardless of backend date string
  const formatDate = (dateStr: string) => {
    const iso = normalizeToIsoDate(dateStr);
    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (iso === localToday) return 'Today';

    // If this is the most recent leaderboard and today has not been played, still show 'Today'
    // (so the user always sees 'Today' at the top, even if backend date is off)
    if (allDates[0] === iso && !hasPlayedDate(iso)) {
      // If the first leaderboard is for today (or missing), label as Today
      if (iso === localToday || allDates[0] === localToday) return 'Today';
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const localYesterday = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    if (iso === localYesterday) return 'Yesterday';

    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <>
      <Helmet>
        <title>High Scores - Pinpoint</title>
        <meta
          name="description"
          content="View daily challenge high scores and leaderboards for Pinpoint."
        />
      </Helmet>

      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold">Daily Leaderboards</h1>
              <p className="text-sm text-muted-foreground">Compare your daily puzzle scores</p>
            </div>
          </div>

          {/* Streak & Next Puzzle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-4 mb-6"
          >
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Flame className="h-5 w-5" />
                <span className="text-sm font-medium">Your Streak</span>
              </div>
              <p className="font-display text-3xl font-bold">{streak.current}</p>
              <p className="text-xs text-muted-foreground">Best: {streak.best} days</p>
            </div>

            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-medium">Next Puzzle</span>
              </div>
              <p className="font-display text-2xl font-bold font-mono">{formatCountdown()}</p>
              <p className="text-xs text-muted-foreground">Until new puzzle</p>
            </div>
          </motion.div>

          {loading && (
            <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              Loading leaderboards…
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="font-medium text-destructive">Couldn’t load leaderboards</p>
              <p className="text-muted-foreground mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && allDates.length > 0 ? (
            <div className="space-y-6 mt-6">
              {allDates.map((date, dateIndex) => {
                const iso = normalizeToIsoDate(date);
                const leaderboard = leaderboardsByDate[iso] ?? [];
                const userResult = userResultsByDate[iso];
                const isPlayedByUser = !!userResult;
                const isToday = iso === normalizeToIsoDate(today);

                const userRank =
                  userResult ? leaderboard.findIndex((r) => r.playerName === userResult.playerName) + 1 : 0;

                return (
                  <motion.div
                    key={iso}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: dateIndex * 0.06 }}
                    className="bg-card rounded-lg p-4 border border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <h2 className="font-display text-lg font-semibold">{formatDate(iso)}</h2>
                      </div>
                    </div>

                    {/* Location display: show city/country for previous days, only hide for today if not played */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4 bg-muted/50 px-3 py-2 rounded-lg">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium">
                        {(isPlayedByUser || !isToday)
                          ? (
                              userResult?.actualDisplayName
                              || leaderboard[0]?.actualDisplayName
                              || [userResult?.city, userResult?.country].filter(Boolean).join(', ')
                              || [leaderboard[0]?.actualState, leaderboard[0]?.country].filter(Boolean).join(', ')
                              || 'Unknown location'
                            )
                          : '—'}
                      </span>
                    </div>

                    {!isPlayedByUser && (
                      <div className="mb-3 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 opacity-70" />
                          <span>
                            {isToday ? "You haven't played today’s puzzle yet." : "You did not play this day’s puzzle."}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {leaderboard.length === 0 ? (
                        <div className="py-6 text-sm text-muted-foreground">No scores yet for this day.</div>
                      ) : (
                        leaderboard.map((result, index) => {
                          const isCurrentUser =
                            userResult && result.playerName === userResult.playerName;

                          const guessedLoc =
                            result.guessDisplayName ||
                            [result.guessCity, result.guessState, result.guessCountry]
                              .filter(Boolean)
                              .join(', ') ||
                            null;

                          const km = toNumber(result.distanceKm);
                          const zoom = toNumber(result.zoomLevel);

                          return (
                            <div
                              key={`${result.id || `${result.date}-${result.playerName}`}-${index}`}
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                isCurrentUser
                                  ? 'bg-primary/10 border border-primary/30 ring-1 ring-primary/20'
                                  : index === 0
                                    ? 'bg-primary/5 border border-primary/10'
                                    : 'bg-background'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                                    index === 0
                                      ? 'bg-primary/20 text-primary'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {index + 1}
                                </span>

                                <div className="min-w-0">
                                  <span className={`font-medium ${isCurrentUser ? 'text-primary' : ''}`}>
                                    {result.playerName}
                                  </span>

                                  {((isPlayedByUser || !isToday) && guessedLoc) && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      Guessed: {guessedLoc}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <p
                                  className={`font-semibold ${
                                    isCurrentUser ? 'text-primary' : index === 0 ? 'text-primary' : ''
                                  }`}
                                >
                                  {formatDistance(km)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Zoom: {Number.isFinite(zoom) ? `${zoom}x` : '—'}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {userRank > 3 && leaderboard.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border text-center text-sm text-muted-foreground">
                        You placed{' '}
                        <span className="font-semibold text-primary">#{userRank}</span> out of{' '}
                        {leaderboard.length} players
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            !loading &&
            !error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-display text-lg font-medium mb-2">No daily scores yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete daily challenges to see leaderboards here!
                </p>
                <Link to="/">
                  <Button>Play Daily Challenge</Button>
                </Link>
              </motion.div>
            )
          )}
        </div>
      </div>
    </>
  );
};

export default HighScores;
