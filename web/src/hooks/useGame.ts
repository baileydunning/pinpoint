import { useState, useCallback, useEffect } from 'react';
import { Puzzle, generatePuzzle, calculateDistance, getDistanceBand } from '@/lib/gameData';
import { saveResult, GameResult } from '@/lib/statsManager';

export type GamePhase = 'viewing' | 'placing' | 'result';

// Zoom levels: 0 = most zoomed in, higher = more zoomed out
const ZOOM_LEVELS = [12, 10, 8, 6]; // Start at city level
const MAX_ZOOM_STEPS = ZOOM_LEVELS.length;

export interface GameState {
  phase: GamePhase;
  puzzle: Puzzle | null;
  zoomStep: number;
  maxZoomStepUsed: number;
  guess: { lat: number; lng: number } | null;
  result: {
    distanceKm: number;
    distanceBand: { label: string; tier: 'excellent' | 'good' | 'fair' | 'far' };
    zoomUsed: number;
  } | null;
}

export const useGame = () => {
  const [state, setState] = useState<GameState>({
    phase: 'viewing',
    puzzle: null,
    zoomStep: 0, // Start fully zoomed in
    maxZoomStepUsed: 0,
    guess: null,
    result: null,
  });

  const loadNewPuzzle = useCallback(async () => {
    const puzzle = await generatePuzzle();
    setState(prev => ({
      ...prev,
      puzzle,
    }));
  }, []);

  useEffect(() => {
    if (!state.puzzle) {
      loadNewPuzzle();
    }
  }, []);

  const startGame = useCallback(async () => {
    setState({
      phase: 'viewing',
      puzzle: null,
      zoomStep: 0,
      maxZoomStepUsed: 0,
      guess: null,
      result: null,
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

  const submitGuess = useCallback(() => {
    setState(prev => {
      if (!prev.guess || !prev.puzzle) return prev;

      const distanceKm = calculateDistance(
        prev.guess.lat,
        prev.guess.lng,
        prev.puzzle.location.lat,
        prev.puzzle.location.lng
      );

      const distanceBand = getDistanceBand(distanceKm);

      const gameResult: GameResult = {
        puzzleId: prev.puzzle.id,
        date: new Date().toISOString().split('T')[0],
        distanceKm,
        zoomLevel: prev.maxZoomStepUsed,
        maxZoom: MAX_ZOOM_STEPS - 1,
        guessLat: prev.guess.lat,
        guessLng: prev.guess.lng,
        actualLat: prev.puzzle.location.lat,
        actualLng: prev.puzzle.location.lng,
        country: prev.puzzle.location.country,
      };
      saveResult(gameResult);

      return {
        ...prev,
        phase: 'result',
        result: {
          distanceKm,
          distanceBand,
          zoomUsed: prev.maxZoomStepUsed,
        },
      };
    });
  }, []);

  const playAgain = useCallback(() => {
    startGame();
  }, [startGame]);

  const getLeafletZoom = () => ZOOM_LEVELS[state.zoomStep];

  return {
    state,
    actions: {
      startGame,
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
