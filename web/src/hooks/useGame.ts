import { useState, useCallback, useEffect } from 'react';
import { Puzzle, generatePuzzle, calculateDistance, getDistanceBand } from '@/lib/gameData';
import { saveResult, GameResult } from '@/lib/statsManager';
import { getDailyPuzzle, hasDailyBeenPlayed, saveDailyResult, getTodayDateString } from '@/lib/dailyPuzzle';
import { reverseGeocodeDetailed } from '@/lib/landChecker';
import { getPlayerName, hasPlayerName } from '@/lib/playerProfile';
import { postHighScore } from '@/pages/HighScores';

export type GamePhase = 'name-input' | 'viewing' | 'placing' | 'result';
export type GameMode = 'daily' | 'practice';

// Zoom levels: 0 = most zoomed in, higher = more zoomed out
const ZOOM_LEVELS = [12, 10, 8, 6]; // Start at city level, zoom out to region
const MAX_ZOOM_STEPS = ZOOM_LEVELS.length;

export interface GameState {
  phase: GamePhase;
  mode: GameMode;
  puzzle: Puzzle | null;
  zoomStep: number;
  maxZoomStepUsed: number;
  guess: { lat: number; lng: number } | null;
  result: {
    distanceKm: number;
    distanceBand: { label: string; tier: 'excellent' | 'good' | 'fair' | 'far' };
    zoomUsed: number;
  } | null;
  dailyCompleted: boolean;
}

export const useGame = () => {
  const [state, setState] = useState<GameState>({
    phase: 'viewing',
    mode: 'practice',
    puzzle: null,
    zoomStep: 0,
    maxZoomStepUsed: 0,
    guess: null,
    result: null,
    dailyCompleted: hasDailyBeenPlayed(),
  });

  // Auto-load practice puzzle on mount
  useEffect(() => {
    if (!state.puzzle && state.phase === 'viewing' && state.mode === 'practice') {
      generatePuzzle().then(puzzle => {
        setState(prev => ({ ...prev, puzzle }));
      });
    }
  }, []);

  const startDailyGame = useCallback(async () => {
    // Check if player has a name
    if (!hasPlayerName()) {
      setState(prev => ({
        ...prev,
        phase: 'name-input',
        mode: 'daily',
      }));
      return;
    }

    // Check if daily already played
    if (hasDailyBeenPlayed()) {
      return false; // Signal that daily is already completed
    }

    // Load daily puzzle
    setState(prev => ({
      ...prev,
      phase: 'viewing',
      mode: 'daily',
      puzzle: null,
      zoomStep: 0,
      maxZoomStepUsed: 0,
      guess: null,
      result: null,
    }));

    const puzzle = await getDailyPuzzle();
    setState(prev => ({
      ...prev,
      puzzle,
    }));
    return true;
  }, []);

  const continueAfterName = useCallback(async () => {
    // Name has been set, now load daily puzzle
    setState(prev => ({
      ...prev,
      phase: 'viewing',
      puzzle: null,
    }));

    const puzzle = await getDailyPuzzle();
    setState(prev => ({
      ...prev,
      puzzle,
    }));
  }, []);

  const cancelNameInput = useCallback(() => {
    // Go back to practice mode
    setState(prev => ({
      ...prev,
      phase: 'viewing',
      mode: 'practice',
    }));
    
    // Load a practice puzzle if needed
    if (!state.puzzle || state.mode === 'daily') {
      generatePuzzle().then(puzzle => {
        setState(prev => ({ ...prev, puzzle }));
      });
    }
  }, [state.puzzle, state.mode]);

  const startPracticeGame = useCallback(async () => {
    setState({
      phase: 'viewing',
      mode: 'practice',
      puzzle: null,
      zoomStep: 0,
      maxZoomStepUsed: 0,
      guess: null,
      result: null,
      dailyCompleted: hasDailyBeenPlayed(),
    });
    
    const puzzle = await generatePuzzle();
    setState(prev => ({
      ...prev,
      puzzle,
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setState(prev => {
      if (prev.zoomStep >= MAX_ZOOM_STEPS - 1) return prev;
      const newStep = prev.zoomStep + 1;
      return {
        ...prev,
        zoomStep: newStep,
        maxZoomStepUsed: Math.max(prev.maxZoomStepUsed, newStep),
      };
    });
  }, []);

  const zoomIn = useCallback(() => {
    setState(prev => {
      if (prev.zoomStep <= 0) return prev;
      return {
        ...prev,
        zoomStep: prev.zoomStep - 1,
      };
    });
  }, []);

  const openMap = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'placing',
    }));
  }, []);

  const backToViewing = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'viewing',
      guess: null,
    }));
  }, []);

  const placePin = useCallback((lat: number, lng: number) => {
    setState(prev => ({
      ...prev,
      guess: { lat, lng },
    }));
  }, []);

  const submitGuess = useCallback(async () => {
    // Take a snapshot of the current state
    let snapshot;
    setState(prev => {
      snapshot = prev;
      return prev;
    });
    if (!snapshot?.guess || !snapshot?.puzzle) return;

    const distanceKm = calculateDistance(
      snapshot.guess.lat,
      snapshot.guess.lng,
      snapshot.puzzle.location.lat,
      snapshot.puzzle.location.lng
    );

    const distanceBand = getDistanceBand(distanceKm);

    let guessDetails = null;
    try {
      guessDetails = await reverseGeocodeDetailed(snapshot.guess.lat, snapshot.guess.lng);
    } catch {
      guessDetails = null;
    }

    // Save to general stats
    const gameResult: GameResult = {
      puzzleId: snapshot.puzzle.id,
      date: new Date().toISOString().split('T')[0],
      distanceKm,
      zoomLevel: snapshot.maxZoomStepUsed,
      maxZoom: MAX_ZOOM_STEPS - 1,
      guessLat: snapshot.guess.lat,
      guessLng: snapshot.guess.lng,
      actualLat: snapshot.puzzle.location.lat,
      actualLng: snapshot.puzzle.location.lng,
      country: snapshot.puzzle.location.country,
      city: snapshot.puzzle.location.city,
      state: snapshot.puzzle.location.state,
      landmark: snapshot.puzzle.location.landmark,
    };
    saveResult(gameResult);

    // If daily mode, also save to daily results and post to server
    if (snapshot.mode === 'daily') {
      const playerName = getPlayerName() || 'Anonymous';
      const dailyResult = {
        date: getTodayDateString(),
        playerName,
        distanceKm,
        zoomLevel: snapshot.maxZoomStepUsed,
        guessLat: snapshot.guess.lat,
        guessLng: snapshot.guess.lng,
        actualLat: snapshot.puzzle.location.lat,
        actualLng: snapshot.puzzle.location.lng,
        country: snapshot.puzzle.location.country,
        city: snapshot.puzzle.location.city,
        state: snapshot.puzzle.location.state,
        landmark: snapshot.puzzle.location.landmark,
        guessCity: guessDetails?.city,
        guessState: guessDetails?.state,
        guessCountry: guessDetails?.country,
        guessDisplayName: guessDetails?.displayName,
      };
      saveDailyResult(dailyResult);
      postHighScore(dailyResult).catch(console.error);
    }

    // Set phase and result for UI
    setState(prev => ({
      ...prev,
      phase: 'result',
      result: {
        distanceKm,
        distanceBand,
        zoomUsed: snapshot.maxZoomStepUsed,
      },
      dailyCompleted: snapshot.mode === 'daily' ? true : prev.dailyCompleted,
    }));
  }, []);

  const playAgain = useCallback(() => {
    startPracticeGame();
  }, [startPracticeGame]);

  const getLeafletZoom = () => ZOOM_LEVELS[state.zoomStep];

  return {
    state,
    actions: {
      startDailyGame,
      startPracticeGame,
      continueAfterName,
      cancelNameInput,
      zoomOut,
      zoomIn,
      openMap,
      backToViewing,
      placePin,
      submitGuess,
      playAgain,
    },
    constants: {
      MAX_ZOOM_STEPS,
      ZOOM_LEVELS,
      getLeafletZoom,
    },
  };
};
